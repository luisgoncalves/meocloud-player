'use strict';

angular.module('cloudPlayer.services')
    .factory('fileManager', ['$window', '$q', 'cloudClient', 'cloudConfig', function ($window, $q, cloudClient, cloudConfig) {

        var currentFile = null;
        var count = 0;
        var db = null;
        var lastCursorKey = cloudConfig.name + '_last_cursor';
        var filesStoreName = 'files';

        // Database actions

        var openDb = function (done) {
            if (db !== null) {
                done();
                return;
            }

            var request = $window.indexedDB.open(cloudConfig.name, 1);
            request.onsuccess = function (event) {
                // Store the db object
                db = event.target.result;
                // Generic error handler
                db.onerror = function (errorEvent) {
                    $window.console.error("Database error: " + errorEvent.target.errorCode);
                };
                done();
            };
            request.onupgradeneeded = function (event) {
                // This is invoked before the 'onsuccess' event, if any changes are needed
                var db = event.target.result;
                $window.console.log('Creating files object store');
                db.createObjectStore(filesStoreName, { keyPath: "path" });
            }
        };

        var addFile = function (item, fileStore) {
            if (item.mime_type.startsWith('audio/mpeg') || item.mime_type === 'audio/wav' || item.path.endsWith('.mp3')) {
                fileStore
                    .put({ path: item.path, tags: null })
                    .onsuccess = function () { $window.console.info('ADD %s', item.path); };
            } else {
                $window.console.log('IGNORE %s due to mime-type %s', item.path, item.mime_type);
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
                            .onsuccess = function () { $window.console.info('REMOVE %s', item.path); };
                    }
                };
        };

        var purgefiles = function (deletedPaths, fileStore) {
            $window.console.log('Paths were deleted:');
            $window.console.log(deletedPaths);

            // Iterate the existing files and remove the deleted paths and all their children
            fileStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    // Check if the current file is a child of the deleted paths (or one of them)
                    if (deletedPaths.some(function (v) { return cursor.key.startsWith(v); })) {
                        cursor.delete().onsuccess = function () {
                            $window.console.info('REMOVE %s', cursor.key);
                            cursor.continue();
                        };
                    } else {
                        cursor.continue();
                    }
                }
            };
        };

        var getRandomFile = function () {

            var deferred = $q.defer();
            var cnt = Math.floor(Math.random() * count);
            db
                .transaction(filesStoreName)
                .objectStore(filesStoreName)
                .openCursor()
                .onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cnt > 0) {
                        cursor.advance(cnt);
                        cnt = -1;
                    } else {
                        deferred.resolve(cursor.value);
                    }
                };
            return deferred.promise;
        };

        var readTags = function (item, url) {

            var deferred = $q.defer();

            if (item.tags) {
                deferred.resolve(item.tags);
                return deferred.promise;
            }

            jsmediatags.read(url, {
                onSuccess: function (res) {

                    var tags = {
                        artist: res.tags.artist,
                        title: res.tags.title,
                        album: res.tags.album,
                        year: res.tags.year
                    };

                    // Store tags on DB if artist or title are known
                    if (tags.artist || tags.title) {
                        item.tags = tags;
                        db
                            .transaction(filesStoreName, 'readwrite')
                            .objectStore(filesStoreName)
                            .put(item)
                            .onsuccess = function () { $window.console.debug('Updated tags for %s', item.path); };
                    }

                    deferred.resolve(tags);
                },
                onError: function (error) {
                    $window.console.warn('Cannot read tags for %s', item.path);
                    $window.console.warn(error);
                    deferred.resolve({});
                }
            });

            return deferred.promise;
        };

        // Process updates from the cloud service (in batches). Returns a promise.

        var deltaProcessor = function (updatedItems, deletedPaths, cursor) {

            var deferred = $q.defer();

            var transaction = db.transaction(filesStoreName, 'readwrite');
            // DB requests will be triggered on this transaction. When it completes, all the requests have succeeded.
            transaction.oncomplete = function () {
                // Store the last known cursor (this helps when something fails in large deltas)
                $window.localStorage.setItem(lastCursorKey, cursor);
                deferred.resolve();
            };
            transaction.onerror = function () {
                deferred.reject();
            };

            var fileStore = transaction.objectStore(filesStoreName);

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

        var update = function () {
            return $q(function (resolve) {
                openDb(function () {
                    // Get updates since the last known cursor
                    $window.console.log('UPDATE STARTED');
                    cloudClient
                        .delta($window.localStorage.getItem(lastCursorKey), deltaProcessor)
                        .then(function () {
                            // Get an updated file count
                            db.transaction(filesStoreName)
                                .objectStore(filesStoreName)
                                .count()
                                .onsuccess = function (event) {
                                    count = event.target.result;
                                    $window.console.info('UPDATE COMPLETED Total files: %d', count);
                                    resolve();
                                };
                        });
                });
            });
        };

        return {
            client: cloudClient,
            hasFiles: function () {
                return count !== 0;
            },
            update: update,
            getRandomFileData: function () {
                return getRandomFile().then(function (file) {
                    currentFile = file;
                    return cloudClient.getFileUrl(file.path).then(function (fileData) {
                        var res = {
                            url: fileData.url
                        };

                        if (cloudConfig.shouldReadTags) {
                            res.readTags = function () {
                                return readTags(file, fileData.url);
                            };
                        }

                        return res;
                    });
                });
            },
            deleteCurrentFile: function () {
                return cloudClient
                    .deleteFile(currentFile.path)
                    .then(function () {
                        currentFile = null;
                        return update();
                    });
            }
        };
    }]);