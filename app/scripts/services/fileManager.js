'use strict';

angular.module('cloudPlayer.services')
    .factory('fileManager', ['$window', '$q', 'cloudClient', 'cloudConfig', function ($window, $q, cloudClient, cloudConfig) {

        var currentFile = null;
        var count = 0;
        var db = null;
        const LastCursorKey = cloudConfig.name + '_last_cursor';
        const FilesStoreName = 'files';

        // Database actions

        var openDb = function (done) {
            if (db != null) {
                done();
                return;
            }

            var request = $window.indexedDB.open(cloudConfig.name, 1);
            request.onsuccess = function (event) {
                // Store the db object
                db = event.target.result;
                // Generic error handler
                db.onerror = function (errorEvent) {
                    console.error("Database error: " + errorEvent.target.errorCode);
                };
                done();
            };
            request.onupgradeneeded = function (event) {
                // This is invoked before the 'onsuccess' event, if any changes are needed
                var db = event.target.result;
                console.log('Creating files object store');
                db.createObjectStore(FilesStoreName, { keyPath: "path" });
            }
        };

        var addFile = function (item, fileStore) {
            if (item.mime_type.startsWith('audio/mpeg') || item.mime_type == 'audio/wav' || item.path.endsWith('.mp3')) {
                fileStore
                    .put({ path: item.path, tags: null })
                    .onsuccess = function () { console.info('ADD %s', item.path); };
            } else {
                console.log('IGNORE %s due to mime-type %s', item.path, item.mime_type);
            }
        };

        var removeFileIfExists = function (item, fileStore) {
            fileStore
                .get(item.path)
                .onsuccess = function (event) {
                    // Was indeed a file. Remove it.
                    if (event.target.result) {
                        fileStore
                            .delete(item.path)
                            .onsuccess = function () { console.info('REMOVE %s', item.path); };
                    }
                };
        };

        var purgefiles = function (deletedPaths, fileStore) {
            console.log('Paths were deleted:');
            console.log(deletedPaths);

            // Iterate the existing files and remove the deleted paths and all their children
            fileStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    // Check if the current file is a child of the deleted paths (or one of them)
                    if (deletedPaths.some(function (v) { return cursor.key.startsWith(v); })) {
                        cursor.delete().onsuccess = function () {
                            console.info('REMOVE %s', cursor.key);
                            cursor.continue();
                        };
                    } else {
                        cursor.continue();
                    }
                }
            };
        };

        var getRandomFile = function (done) {

            // TODO check this
            if (count === 0) {
                return;
            }

            var cnt = Math.floor(Math.random() * count);
            db
                .transaction(FilesStoreName)
                .objectStore(FilesStoreName)
                .openCursor()
                .onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cnt > 0) {
                        cursor.advance(cnt);
                        cnt = -1;
                    } else {
                        done(cursor.value);
                    }
                };
        };

        // Process updates from the cloud service (in batches). Returns a promise.

        var deltaProcessor = function (updatedItems, deletedPaths, cursor) {

            var deferred = $q.defer();

            var transaction = db.transaction(FilesStoreName, 'readwrite');
            // DB requests will be triggered on this transaction. When it completes, all the requests have succeeded.
            transaction.oncomplete = function () {
                // Store the last known cursor (this helps when something fails in large deltas)
                $window.localStorage.setItem(LastCursorKey, cursor);
                deferred.resolve();
            };
            transaction.onerror = function () {
                deferred.reject();
            };

            var fileStore = transaction.objectStore(FilesStoreName);

            if (deletedPaths.length > 0) {
                purgefiles(deletedPaths, fileStore);
            }

            updatedItems.forEach(function (item) {
                if (item.is_dir) {
                    removeFileIfExists(item, fileStore);
                } else {
                    addFile(item, fileStore);
                }
            });

            return deferred.promise;
        };

        // Public API

        return {
            client: cloudClient,
            update: function () {
                return $q(function (resolve) {
                    openDb(function () {
                        // Get updates since the last known cursor
                        console.log('UPDATE STARTED');
                        cloudClient
                            .delta($window.localStorage.getItem(LastCursorKey), deltaProcessor)
                            .then(function () {
                                // Get an updated file count
                                db.transaction(FilesStoreName)
                                    .objectStore(FilesStoreName)
                                    .count()
                                    .onsuccess = function (event) {
                                        count = event.target.result;
                                        console.info('UPDATE COMPLETED Total files: %d', count);
                                        resolve();
                                    };
                            });
                    });
                });
            },
            getRandomFileUrl: null,
            deleteCurrentFile: null
        };
    }]);