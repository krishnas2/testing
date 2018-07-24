var https=require('https'),async= require('async');
/*
var i=(c)=>{
	
	setTimeout(()=>{console.log('edwe');c(null,'sdfsd')},5000);
}
/* 
async.series([
(c)=>{
	
	c(null,'xcx');
},(c)=>{
	console.log('rferfefe');
	c(null,'dee')
}

],(err,res)=>{
		console.log(res+'err'+err);
	
});
/*
var students = [
{"id":"1", "name":"Jerry", "email":"jerry@example.com", "subject":"Maths, Phy, Chem", "marks":80},
{"id":"2", "name":"Nick", "email":"nick@example.com", "subject":"Maths, Phy, Chem", "marks":70},
{"id":"3", "name":"Adam", "email":"adam@example.com", "subject":"Maths, Phy, Chem", "marks":65},
{"id":"4", "name":"Ishan", "email":"ishan@example.com", "subject":"Maths, Phy, Chem", "marks":68},
{"id":"5", "name":"Jill", "email":"jill@example.com", "subject":"Maths, Phy, Chem", "marks":90},
{"id":"6", "name":"Peter", "email":"peter@example.com", "subject":"Maths, Phy, Chem", "marks":95},
{"id":"7", "name":"Jack", "email":"jack@example.com", "subject":"Maths, Phy, Chem", "marks":96},
{"id":"8", "name":"Rehan", "email":"rehan@example.com", "subject":"Maths, Phy, Chem", "marks":98},
{"id":"9", "name":"Martin", "email":"martin@example.com", "subject":"Maths, Phy, Chem", "marks":80},
{"id":"10", "name":"Aaron", "email":"aaron@example.com", "subject":"Maths, Phy, Chem", "marks":80},
{"id":"11", "name":"George", "email":"george@example.com", "subject":"Maths, Phy, Chem", "marks":80},
{"id":"12", "name":"Nelson", "email":"nelson@example.com", "subject":"Maths, Phy, Chem", "marks":80}
];
 */
async.each(['a','b','s'], function (student, callback) {
if (student) {
//Do something here.
//This will print the each student name and marks in forward series.
console.log("Name: "+ student);
if(student=='a')
callback('sc');
if(student=='b')
	callback('dsa');
}
},(err)=>{
	console.log(err);
});
/*
async.setImmediate(function (a, b, c) {
 console.log(a,b,c);
}, 1, 2, 3);


/*
async.waterfall([
(c)=>{
	
	//setTimeout(()=>{console.log('werfer')},5000);
	c(null,'a');
},(d,c)=>{
	console.log(d+'wrferfefe');
	c(null,{"erf":{"type":"err","success":[],"error":['erer','rewr'],"rgf":{"type":"omni","success":[],"error":['iuo','ewrw']}}});
},(temp1,c)=>{
	temp1["error"]=[];

	var recurobjs=(objs)=>{
		console.log('once called');
	for (k in objs){
		console.log('coming1');
		if(objs.hasOwnProperty(k)){
			console.log('coming2',typeof(objs[k]));
			if(typeof(objs[k])==="object"){
				if(objs[k].hasOwnProperty("error")){
					console.log('objerror',objs[k]["error"]);
					temp1["error"].push.apply(temp1["error"], objs[k]["error"]);
				}
				recurobjs(objs[k]);
				
			}
		}
	}
	};
	console.log('about to call');
	recurobjs(temp1);
	console.log(temp1,'efwrferfefe');
	c('d','ffeff')
}

],(err,res)=>{
		console.log('res  '+res+'  err    '+err);
	
});

 async.auto({
    one: function(callback){
        setTimeout(function(){
            callback( 1);
        }, 200);
    }, 
    // If two does not depend on one, then you can remove the 'one' string
    //   from the array and they will run asynchronously (good for "parallel" IO tasks)
    two: ['one', function(callback, results){
        setTimeout(function(){
            callback( 2);
        }, 100);
    }],
    // Final depends on both 'one' and 'two' being completed and their results
    final: ['one', 'two',function(err, results) {
    // results is now equal to: {one: 1, two: 2}
    }]
});
//https://api.mockaroo.com/api/generate.json?key=d55c4580&schema=Discounts
var headers={
		'Content-Type':'application/json',
	};
	var newOptions={
		host:'api.mockaroo.com',
		port:443,
		path:'/api/generate.json?key=d55c4580&schema=Discounts',
		method:'GET',
		headers:headers
	};
	//console.log('query',instance_url,newOptions.path);
	var qryObj=https.request(newOptions,function(result){
		result.setEncoding('utf-8');
		var responseString1='';
		result.on('data',function(respObj){
			responseString1+=respObj;
		});
		result.on('end',function(){
			var resp=JSON.parse(responseString1);
			console.log('resp',resp);
			
			/* if(resp.done)
				console.log(msg); 
		});
	});
	qryObj.on('error',(e)=>{
		console.log('problemquery',e);
		
	});
	qryObj.end();
  
 */
