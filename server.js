var express = require('express');
var app = express();
var mongourl = 'mongodb://ivanwong:abc123@ds111748.mlab.com:11748/comps381f';
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var session = require('express-session');
var SECRETKEY = 'I want to pass COMPS381F';
var bodyParser = require('body-parser');
/***/
var fileUpload = require('express-fileupload');
var ObjectId = require('mongodb').ObjectID;

/***/
app.use(bodyParser.urlencoded({  extended: true }));
app.use(bodyParser.json());

app.use(session({
	secret: SECRETKEY,
	resave: true,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.get('/',function(req,res){
	res.redirect('/login');
});

app.get("/register", function(req,res) {
	 res.sendFile(__dirname + '/public/register.html');
});

app.get("/login", function(req,res) {
	 res.sendFile(__dirname + '/public/login.html');
});

app.get("/logout", function(req,res){
	req.session.userId = null;
	res.sendFile(__dirname + '/public/logout.html');
	console.log(req.session.userId);
	res.redirect('/login');
});


app.get("/rate",function(req,res){
	res.sendFile(__dirname +  "/public/rate.html");
});


/*register*/
app.post("/registerSubmit", function(req,res) {
	var u = {userId : req.body.userId,
			 userPW : req.body.password};
	console.log(u);
	req.session.userId == null;
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB @registerSubmit');
//	console.log(req.body);
		checkDup(db,req.body.userId,function(result){		
			if (result == true) {
				createReg(db,u,function(success) {
					db.close();
					console.log('Disconnected from MongoDB\n');	
					res.end('Success: ' + u.userId);
				});
			} else {
				console.log("The userId has been registered before");
				res.end('The userId has been registered before');
			}
		});
	});
});

/*login*/
app.post('/processlogin',function(req,res){
	req.session.userId == null;
	var userId = req.body.userId;
	var userPW = req.body.password;
	console.log(userId+","+userPW);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB @ processlogin');
		findUser(db,userId,userPW,function(sucess){
			console.log(sucess);
			db.close();
			if(sucess == true){
				req.session.userId = userId;
				res.redirect('/readAll');
				res.end("successful");
			}
			else{
				res.status(500).end("Login Fail");
			}
		});		
	});
});

app.post('/rate', function(req,res){
	if(req.session.userId == null){
		res.end("Please login before rating");	
	}
	var score = req.body.score;
	var userId = req.session.userId;
	var id = ObjectId(req.query._id);
	console.log(score);
	console.log(userId);
	console.log(id);
	if(score>0 && score<11){
			MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB @ rate');
			db.collection('restaurants').findOne({'_id' : id, 'grades.userId' : userId},function(err,doc){
				assert.equal(err,null);	
				console.log(doc)
				if(doc == null){
				db.collection("restaurants").updateOne( {"_id" : id},{$push : {grades :{'userId' : userId, 'score' : score}}},
					function(err,result) {
					assert.equal(err,null);
					res.end('You have rated '+score+' to the restaurant');	
				});
				}
				else{
					res.end('You rated this restaurant before');
				}
			});
		});
	}else{
		res.end("The score of rating must within 1-10");
	}
});

/*search*/
app.get("/read", function(req,res) {
	if(req.session.userId == null || req.session.userId == undefined){
		console.log('login plz');
		res.redirect('/login');
	}else{
		
		var criteria = {};
	
		if(req.query.name != undefined){
			criteria['name'] = req.query.name;		
		}
	
		else if(req.query.borough != undefined){
			criteria['borough'] = req.query.borough;
		}
		else if(req.query.cuisine != undefined){
			criteria['cuisine'] = req.query.cuisine;
		}
	
	console.log(JSON.stringify(criteria));
	
		MongoClient.connect(mongourl, function(err, db) {
	    assert.equal(err,null);
	    console.log('Connected to MongoDB: readALL \n');	
	    db.collection('restaurants').find(criteria).sort({item:1}).toArray(function(err,results) {
		if (err) {
	          console.log(err);
        	} else {
        	db.close();
	  	res.render('list',{ c :results,session: req.session, cr : JSON.stringify(criteria)});
		res.end();
   		}
  	    });
	   	});
	}
});


/*search/api*/

app.get("/api/read/:f1/:c1", function(req,res) {
		
		var criteria = {};
	
		if(req.params.f1 != undefined){
			criteria[req.params.f1] = req.params.c1;		
		}
	
	
//	console.log(JSON.stringify(criteria));
	
		MongoClient.connect(mongourl, function(err, db) {
	    assert.equal(err,null);
	    console.log('Connected to MongoDB: readALL \n');	
	    db.collection('restaurants').find(criteria).sort({item:1}).toArray(function(err,results) {
		if (err) {
	          console.log(err);
        	} else {
        	db.close();
	  	res.json(JSON.stringify(results));
		res.end();
   		}
  	    });
	   	});
	
});


app.get("/api/read/:f1/:c1/:f2/:c2", function(req,res) {
		
		var criteria = {};
	
		if(req.params.f1 != undefined){
			criteria[req.params.f1] = req.params.c1;		
		}
	
		else if(req.params.f2 != undefined){
			criteria[req.params.f2] = req.params.c2;
		}
		
//	console.log(JSON.stringify(criteria));
	
		MongoClient.connect(mongourl, function(err, db) {
	    assert.equal(err,null);
	    console.log('Connected to MongoDB: readALL \n');	
	    db.collection('restaurants').find(criteria).sort({item:1}).toArray(function(err,results) {
		if (err) {
	          console.log(err);
        	} else {
        	db.close();
	  	res.json(JSON.stringify(results));
		res.end();
   		}
  	    });
	   	});
	
});


app.get("/api/read/:f1/:c1/:f2/:c2/:f3/:c3", function(req,res) {
		
		var criteria = {};
	
		if(req.params.f1 != undefined){
			criteria[req.params.f1] = req.params.c1;		
		}
	
		else if(req.params.f2 != undefined){
			criteria[req.params.f2] = req.params.c2;
		}
		else if(req.params.f3 != undefined){
			criteria[req.params.f3] = req.params.c3;
		}
	
//	console.log(JSON.stringify(criteria));
	
		MongoClient.connect(mongourl, function(err, db) {
	    assert.equal(err,null);
	    console.log('Connected to MongoDB: readALL \n');	
	    db.collection('restaurants').find(criteria).sort({item:1}).toArray(function(err,results) {
		if (err) {
	          console.log(err);
        	} else {
        	db.close();
	  	res.json(JSON.stringify(results));
		res.end();
   		}
  	    });
	   	});
	
});




/**call by /registerSubmit, check duplicate userId**/
function checkDup(db,userId,callback){
	 db.collection("userAccount").findOne({"userId" : userId}, function(err,doc){
		 assert.equal(err,null);
		if(!doc){
			callback(true);
		}
		else{
			callback(false);
		}
	});
}
/**call by /registerSubmit**/
function createReg(db,u,callback){
	db.collection("userAccount").insertOne(u, function(err,result) {
		assert.equal(err,null);
		console.log("insertOne() was successful _id = " + JSON.stringify(result.insertedId) );
		callback(result);				
	});
}
/**called by /processlogin**/
function findUser(db,userId,userPW, callback){
	db.collection("userAccount").findOne({"userId" : userId, "userPW" : userPW}, function(err,doc){
		 assert.equal(err,null);
		 if(doc){
			 callback(true);
		 }
		 else{
			 callback(false);
		 }
	});
}

/**************************************************/

/**list all documents, name only**/
app.get("/readAll", function(req,res) {
	console.log("Welcome "+req.session.userId+" !");
	if(req.session.userId == null || req.session.userId == undefined){
		console.log('login plz');
		res.redirect('/login');
	}else{
		MongoClient.connect(mongourl, function(err, db) {
	    assert.equal(err,null);
	    console.log('Connected to MongoDB: readALL \n');	
	    db.collection('restaurants').find().sort({item:1}).toArray(function(err,results) {
		if (err) {
	          console.log(err);
        	} else {
        	db.close();
	  	res.render('list',{ c :results,session: req.session, cr : null});
   		}
  	    });
	   	});
	}
});


/** show details of 1 restaurant **/
app.get('/showdetails', function(req,res) {
	console.log("req.sess.uid: " + req.session.userId);
//check login
	if(req.session.userId == null || req.session.userId == undefined){
		console.log('login plz');
		res.redirect('/login');
	}else{
		if (req.query.id != null) {
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB @ details\n');     
			db.collection('restaurants').findOne({'_id': ObjectId(req.query.id)}, function(err,results) {
     	   	  	  if (err) {
        			  console.log(err);
       			   } else {
       		 	    db.close();
				//console.log(results);        
	  		   	res.render('details',{ c :results});
	   	     	  }
      			});
       		});
		} else {
		res.status(500).end('ObjectId missing!');
		}
	}
});

/** form for input data**/
app.get('/createRest', function(req, res){
	//check login?
	console.log('@createRest');
	if(req.session.userId == null || req.session.userId == undefined){
		console.log('login plz');
		res.redirect('/login');
	}else{
		res.sendFile(__dirname + '/views/new.html');
	}
});;

app.use(fileUpload());   // add 'files' object to req

/** click create btn (new restaurant doc)**/
app.post('/create', function(req, res) { // "/create"
	console.log('/upload');
    //check name
    if (!req.body.restName) {
        res.send('No \"Name\". Please Enter Restaurant Name!');
        return;
    }

console.log(req.session.userId);

    MongoClient.connect(mongourl,function(err,db) {
      console.log('Connected to mlab.com');
      assert.equal(null,err);
      createRest(db, req.body,req.files.sampleFile, req.session.userId, function(result) { //call create()
        db.close();
        if (result.insertedId != null) {
         // res.status(200);
			res.writeHeader(200, {"Content-Type": "text/html"}); // Q8:return response--> JSON
			console.log('Inserted: ' + result.insertedId);
			res.write('Inserted: ' + result.insertedId); 
			res.write('<br>status: ok<br>'); 
			res.write('result:' + result);	 
			res.write('<br><br><a href="/readAll">back to real ALL</a>');
			res.end(); //
        } else {
          res.status(500);
          res.end(JSON.stringify(result));
        }
      });
    });
});


/*api/create*/
app.post('/api/create', function(req, res) { // "/create"
	console.log('/upload');
	var userId = null;

    MongoClient.connect(mongourl,function(err,db) {
      console.log('Connected to mlab.com');
      assert.equal(null,err);
	  console.log(req.body);
      createRest(db,req.body,req.files.sampleFile, userId, function(result) { //call create()
        db.close();
        if (result.insertedId != null) {
			var status = "OK";
			res.json('status: '+status+', _id: ' + JSON.stringify(result.insertedId));
			res.end();

        } else {
			var status = "failed";
			res.json('status: '+status );
			res.end();
        }
      });
    });
});

function createRest(db ,bodyObj, bfile, userId ,callback) {
	if(bfile != null || bfile != undefined){
		var insertDoc = {
			address : {
			street : bodyObj.street,
			zipcode : bodyObj.zipcode,
			building : bodyObj.building,
			coord : [bodyObj.lon, bodyObj.lat]
			},
			borough : bodyObj.borough,
			cuisine : bodyObj.cuisine,
			grades : [
				{userId : null, score : null }
			],
			name : bodyObj.restName,
			restaurant_id : bodyObj.restId,
			createdby: userId,
			photo:{
				data : new Buffer(bfile.data).toString('base64'),
				mimetype : bfile.mimetype,
			}
		};
	}else{
			var insertDoc = {
				address : {
				street : bodyObj.street,
				zipcode : bodyObj.zipcode,
				building : bodyObj.building,
				coord : [bodyObj.lon, bodyObj.lat]
				},
				borough : bodyObj.borough,
				cuisine : bodyObj.cuisine,
				grades : [
					{userId : null, score : null }
				],	
				name : bodyObj.restName,
				restaurant_id : bodyObj.restId,
				createdby: userId
					};
		}
  db.collection("restaurants").insertOne( insertDoc, function(err,result) {
    assert.equal(err,null);
    if (err) {
      console.log('insertOne Error: ' + JSON.stringify(err));
      result = err;
    } else {
      console.log("Inserted _id = " + result.insertedId);
    }
    callback(result);
  });
}

//change
/*function updateRest() {}
*/


/*********************** update information ************************************/
/** url to change data**/
app.get('/change', function(req, res){
	console.log('@/change');
	//check login
	if(req.session.userId == null || req.session.userId == undefined){
		console.log('login plz');
		res.redirect('/login');
	}
	else{
	
	req.session.docId = req.query._id;
 	MongoClient.connect(mongourl,function(err,db) {
	      console.log('Connected to mlab.com');
	      assert.equal(null,err);

		//check owner 
		isowner(db, req.query._id, req.session.userId, function(sucess){
			console.log(sucess);

			if(sucess == true){
				//get document
				db.collection('restaurants').findOne({'_id': ObjectId(req.query._id)}, function(err,doc) {
	     	   	  	  if (err) {
        			  console.log(err);
       				   } else {
       			 	    db.close();
				//console.log(doc);       
				res.render('renew', {c: doc});
		   	     	  }
	      			});
			} else {
				console.log("only document creater can edit.");
				res.end("only document creater can edit.");
			}
		});
	});
	}
});

/** update data***/
app.post('/update', function(req, res) {
	console.log('/update rest');

	var bodyObj = req.body;
	var bfile = req.files.sampleFile;

	var updateDoc = {
		address : {
		 street : bodyObj.street,
		 zipcode : bodyObj.zipcode,
		 building : bodyObj.building,
		 coord : [bodyObj.lon, bodyObj.lat]
		 },
		 borough : bodyObj.borough,
		 cuisine : bodyObj.cuisine,
		 name : bodyObj.restName,
		 restaurant_id : bodyObj.restId,
	};

	if (bfile.name != ''	){
	var updatephoto = {photo:{
		    data : new Buffer(bfile.data).toString('base64'),
 		   mimetype : bfile.mimetype,
		}};
	}

MongoClient.connect(mongourl,function(err,db) {
	      console.log('Connected to mlab.com');
	      assert.equal(null,err);

	console.log(updateDoc);

	  db.collection('restaurants').updateOne( {_id: ObjectId(bodyObj.key)}, {$set : updateDoc}, function(err,result) {
	    assert.equal(err,null);
	    if (err) {
	      console.log('update Error: ' + JSON.stringify(err));
	      result = err;
	    } else {
	      console.log("update doc success");
	    }
//console.log(result);
	  });

	if (bfile.name != ''	){
	  db.collection('restaurants').updateOne( {_id: ObjectId(bodyObj.key)}, {$set : updatephoto});
	      console.log("update photo success");
	}


	db.close;

});

res.redirect('/readAll');
});
/************* delete ********************/
/** url: remove data**/
app.get('/remove', function(req, res){
	//check login
	console.log('@remove');
	if(req.session.userId == null || req.session.userId == undefined){
		console.log('login plz');
		res.redirect('/login');
	}

	req.session.docId = req.query._id;
	var msg="";

 	MongoClient.connect(mongourl,function(err,db) {
	      console.log('Connected to mlab.com');
	      assert.equal(null,err);

		//check created by 
		isowner(db, req.query._id, req.session.userId, function(sucess){
			console.log(sucess);

			if(sucess == true){
			//delete document
				db.collection("restaurants").remove( { '_id' : ObjectId(req.query._id)  } , function(err,result) {
				assert.equal(err,null);
				if (err) {
			      		console.log('remove Error: "\n' + JSON.stringify(err));
			      		msg = 'remove Error: ' + JSON.stringify(err);
				      result = err;
					res.end(result);
				} else {
			      		console.log("Remove success !");
					msg = "Delete was successful.";
					res.render('error', {msg});
			    	}
				});
			} else {
				console.log("only document creater can delete.");
				res.end("only document creater can delete.");
			}
		
			db.close();
		});
	});

});
//check document owner
function isowner(db, objid, userid, callback){
	db.collection("restaurants").findOne( { '_id' : ObjectId(objid) , 'createdby': userid}  , function(err,doc) {
		assert.equal(err,null);
		 if(doc){    callback(true);    }
		 else{    callback(false);    }
	});
}
app.listen(process.env.PORT || 8099);
