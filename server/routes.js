(function() {

  'use strict';
  var express = require('express');
  var router = express.Router();
  var fs = require('fs');
  var path = require('path');
  var yaml = require('js-yaml');
  var parseString = require('xml2js').parseString;

  /* GET home page. */
  router.get('/', function(req, res) {
    res.render('index');
  });

  var current_example = 'Caveman.gmx';

  /* Serve the Tree */
  router.get('/api/tree', function(req, res) {
    var _p;
    if (req.query.id == 1) {
      _p = path.resolve(__dirname, '..', 'examples', current_example);
      processReq(_p, res);

    } else {
      if (req.query.id) {
        _p = req.query.id;
        processReq(_p, res);
      } else {
        res.json(['No valid data found']);
      }
    }
  });

  var parseEyFile = function(file_path) {
      return yaml.safeLoad(fs.readFileSync(file_path, 'utf8'));
  }

  var parseXMLFile = function(file_path, response) {
    console.log('Parsing XML file', file_path)
    fs.readFile(file_path, function(err, xml_data) {
        
        parseString(xml_data, function (err, result) {
          console.dir(result);
          response.send(JSON.stringify(result)); 
        }); 
    });
    

  }

  /* Serve a Resource */
  router.get('/api/resource', function(req, res) {
    var file_path_to_load = req.query.resource;
    var file_extension = path.extname(file_path_to_load);
    

    console.log()

    var result_as_json = {}
    if (file_extension === ".ey")
      result_as_json = parseEyFile(file_path_to_load)
    else if (file_extension === ".gmx")
      return parseXMLFile(file_path_to_load, res)
    else
      {res.send(fs.readFileSync(file_path_to_load, 'UTF-8')); return;}

    console.log(result_as_json)
    res.send(result_as_json); 
    return;
    
    
  });

// 
// # Process request will loop over each directory and push a node into the list
// 
  function processReq(_p, res) {
    var resp = [];
    fs.readdir(_p, function(err, list) {
      for (var i = list.length - 1; i >= 0; i--) {
        var jstree_json_node = processNode(_p, list[i]);
        if (jstree_json_node)
        resp.push(jstree_json_node);
      }
      res.json(resp);
    });
  }



// 
// # Process node converts normal file into a valid jstree object
// 
  function processNode(_p, f) {

    var s = fs.statSync(path.join(_p, f));
    if (f === 'toc.txt') return null;
    // 
    // # Check if it starts with a dot, if so its a hidden file
    // 
    if (f.indexOf('.') === 0) return null; 


    // 
    // # Only support .ey files
    // 
    // if ((!s.isDirectory()) && f.indexOf('.ey') === -1) return null;

    var file_extension = path.extname(f);
    
    return {
      "id": path.join(_p, f),
      "text": f,
      "icon" : s.isDirectory() ? 'jstree-folder' : 'jstree-custom-file-'+file_extension.substring(1),
      "state": {
        "opened": false,
        "disabled": false,
        "selected": false
      },
      "li_attr": {
        "base": path.join(_p, f),
        "isLeaf": !s.isDirectory()
      },
      "children": s.isDirectory()
    };
  }

  module.exports = router;

}());
