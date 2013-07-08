var Cursor = require('./cursor').Cursor;

var PreCursor = function(collection, options) {
  var self = this;

  // Internal state
  var _write_concern = {w:1};
  var _limit = null;
  var _skip = null;
  var _isolated = false;
  var _multi = true;
  var _sort = null;
  var _readPreference = null;  
  var _options = options || {};
  var _selector = options.selector || {};
  var _fields = options.fields || null;  
  var _cursor_options = options.options || {};
  var _readPreference = null;

  // console.dir(options)

  // Set up the cursor
  var _cursor = new Cursor(
        collection.db, collection, _selector
      , _options.fields, _cursor_options
    );

  // Write branch options
  var writeOptions = {
    insert: function(documents, callback) {
      // Merge together options
      var options = _write_concern;      
      // Execute insert
      collection.insert(documents, options, callback);
    },
    
    save: function(document, callback) {
      // Merge together options
      var options = _write_concern;      
      // Execute save
      collection.save(document, options, callback);
    },

    find: function(selector) {
      _selector = selector;
      return writeOptions;
    },

    limit: function(limit) {
      _limit = limit;
      return writeOptions;
    },

    sort: function(sort) {
      _sort = sort;
      return writeOptions;
    },

    isolated: function() {
      _isolated = true;
      return writeOptions;
    },

    //
    // Update is implicit multiple document update
    update: function(operations, callback) {
      // Merge together options
      var options = _write_concern;
      // Asking for isolated support
      if(_isolated) _selector['$isolated'] = true;
      if(_multi) options.multi = true;
      // Execute options
      collection.update(_selector, operations, options, function(err, result, obj) {
        callback(err, obj);
      });
    },

    updateOne: function(operations, callback) {
      // Set as multi
      _multi = false;
      // Execute update
      this.update(operations, callback);
    },

    updateOneAndGet: function(operations, callback) {
      // Merge together options
      var options = _write_concern;
      // Set new option
      options['new'] = true;
      // execute find and modify
      collection.findAndModify(_selector, _sort, operations, options, callback);
    },

    getOneAndUpdate: function(operations, callback) {
      // Merge together options
      var options = _write_concern;
      // execute find and modify
      collection.findAndModify(_selector, _sort, operations, options, callback);      
    },

    replaceOneAndGet: function(document, callback) {
      // Merge together options
      var options = _write_concern;
      // Set new option
      options['new'] = true;
      // execute find and modify
      collection.findAndModify(_selector, _sort, document, options, callback);      
    },

    getOneAndReplace: function(document, callback) {
      // Merge together options
      var options = _write_concern;
      // execute find and modify
      collection.findAndModify(_selector, _sort, document, options, callback);            
    },

    getOneAndRemove: function(callback) {
      // Merge together options
      var options = _write_concern;      
      // execute find and modify
      collection.findAndRemove(_selector, _sort, options, callback);
    }
  }

  // Set write concern
  this.withWriteConcern = function(write_concern) {
    // Save the current write concern to the PreCursor
    _write_concern = write_concern;

    // Only allow legal options
    return writeOptions;
  }

  // All the read options
  var readOptions = {
    //
    // Backward compatible methods
    toArray: function(callback) {
      // console.dir(_cursor_options)
      _cursor.toArray(callback);
    },

    each: function(callback) {
      _cursor.each(callback);
    },    

    nextObject: function(callback) {
      _cursor.nextObject(callback);
    },    

    setReadPreference: function(readPreference, callback) {
      _readPreference = readPreference;
      _cursor.setReadPreference(readPreference, callback);
      return readOptions;
    },

    count: function(callback) {
      _cursor.count(callback);
    },
    // !------------------------------

    withReadPreference: function(readPreference) {
      _readPreference = readPreference;
      _cursor.setReadPreference(readPreference);
      return readOptions;
    },

    // Internal methods
    limit: function(limit) {
      // console.log("----------------- limit")
      _limit = limit;
      // _cursor_options.limit = limit;
      _cursor.limit(limit);
      return readOptions;
    },

    skip: function(skip) {
      // console.log("----------------- skip")
      _skip = skip;
      // _cursor_options.skip = skip;
      _cursor.skip(skip);
      return readOptions;
    },

    sort: function(sort) {
      // console.log("----------------- sort")
      _sort = sort;
      // _cursor_options.sort = sort;
      _cursor.sort(sort);
      return readOptions;
    },

    batchSize: function(batchSize) {
      // console.log("----------------- batchSize")
      _batchSize = batchSize;
      // _cursor_options.batchSize = batchSize;
      _cursor.batchSize(batchSize);
      return readOptions;
    },

    //
    // Find methods
    withReadPreference: function(readPreference) {
      // console.log("----------------- withReadPreference")
      _readPreference = readPreference;
      return readOptions;
    },

    get: function(callback) {
      // // Fill in all the options
      // if(_limit) _options.limit = _limit;
      // if(_skip) _options.skip = _skip;
      // if(_sort) _options.sort = _sort;
      // Set up the cursor
      var cursor = new Cursor(
            collection.db
          , collection
          , _selector
          , _options.fields
          , _cursor_options
        );

      // Execute the toArray function
      cursor.toArray(callback);
    }
  }

  //
  // Backward compatible settings
  Object.defineProperty(readOptions, "timeout", {
    get: function() {
      return _cursor.timeout;
    }
  });

  Object.defineProperty(readOptions, "read", {
    get: function() {
      return _cursor.read;
    }
  });
  // !------------------------------

  // Start find
  this.find = function(selector) {
    // console.log("----------------- find")
    // Save the current selector
    _selector = selector;
    // Return only legal read options
    return readOptions;
  }
}

exports.PreCursor = PreCursor;