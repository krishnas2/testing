// app.js
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var querystring=require('querystring');
var https=require('https');
var username='',
access_token='',
instance_url='',
squery='/services/data/v41.0/query/?q=';

app.use(express.static(__dirname + '/node_modules'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

app.get('/', (req, res,next) => {  
    res.sendFile(__dirname + '/login.html');
});
app.get('/index', (req, res,next) =>{  
    res.sendFile(__dirname + '/index.html');
});
app.post('/', (req, res,next) =>{  
//username=req.body.username;
for (i in req.body){
		i=JSON.parse(i);
		username=i.username,
		console.log(i.username);
	}
    res.send('/index');
	res.end();
});

var objectexists=(bundle,name,client)=>{
	que='select+Id+from+vlocity_cmt__'+bundle+'__c+where+Name="'+name.replace(/\s/g,'+')+'"';
	client.emit('objjobs','Checking Whether'+bundle+' Object with name '+name+' exists');
	RestCallMapper(que,'genericexists',name,client);
	switch(bundle){
		case "VlocityUITemplate":
		case "VlocityCard":
		case "VlocityUILayout":
						que2='select+Id+from+vlocity_cmt__'+bundle+'__c+where+Name="'+name.replace(/\s/g,'+')+'"and+vlocity_cmt__Active__c=true';
						RestCallMapper(que,'genericactive',name,client);break;
	}
}

var RestCallMapper=(query,msg,opt,client)=>{
	var headers={
		'Content-Type':'application/json',
		'Authorization':access_token
	};
	var newOptions={
		host:instance_url,
		port:null,
		path:squery+query,
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
			console.log('respo',resp.done,resp.totalSize);
			
			
			 if(resp.done && resp.totalSize>0){
				 switch(msg){
					 case "genericactive":client.emit('objjobs','Active version Exists');client.emit('objjobs','Checkign Object is Done');break;
					 case "genericexists":client.emit('objjobs','Object Exits');break;
             case "CheckOmniscriptsExists":client.emit('objjobs',"Omniscript Exits");OmniScriptcheckactiveversion(opt,client);break;
				case "DR Exists": client.emit('objjobs','Data Raptor Exits');drtype(resp.records,opt,client);break;
				case "ExtractDRperformop":client.emit('objjobs','Starting operations for Extract DR');ExtractDRperformop(resp.records,client);break;
				case "DRqueries":client.emit('objjobs','DR query is success');break;
				case "OmniscriptsExists":client.emit('objjobs','Omniscript Exits');getOmniScriptDetails(resp,client);break;
				case "OmniScriptperformop":client.emit('objjobs','Starting operations for Omniscript');OmniScriptperformop(resp,client);break;
			}
			 }
			 else if (resp.done && resp.totalSize==0){
				 switch(msg){
					 case "genericactive":client.emit('objjobserr','Active version Doesnt Exists');client.emit('objjobs','Active version Doesnt Exists');client.emit('objjobs','Checking Object is Done');break;
					 case "genericexists":client.emit('objjobserr',"Object Doesn't Exits,Give Correct Name and try again");client.emit('objjobs',"Object Doesn't Exits,Give Correct Name and try again");client.emit('objjobserr',"Checkign of Object is Done");break;
           case "CheckOmniscriptsExists":client.emit('objjobserr',"Omniscript Doesn't Exits, Give correct name");client.emit('objjobs',"There is no active version of this omniscript");client.emit('objjobs','Checking Omniscript is Done');break;
				case "DR Exists": client.emit('objjobs',"DR query may be correct but there were no records for the query");client.emit('objjobserr',"DR query may be correct but there were no records for the query");client.emit('objjobs','Checking DR is Done');break;
				case "ExtractDRperformop":client.emit('objjobs','DR query may be correct but to perform any operation no records for the query');break;
				case "OmniscriptsExists":client.emit('objjobs',"Omniscript query may be correct but there were no records for the query"+JSON.stringify(resp,null,2));client.emit('objjobserr',"Omniscript query may be correct but there were no records for the query,kindly activate the Omniscript and try again"+JSON.stringify(resp,null,2));client.emit('objjobs','Checking Omniscript is Done');break;
				case "DRqueries":client.emit('objjobs','DR query may be correct but there were no records for the query,this could be due to field level security as well'+JSON.stringify(resp,null,2));break;
				case "OmniScriptperformop":client.emit('objjobs','Omniscript query may be correct but there were no records for the query to perform any opration');break;
			}
			 }
			 else{
				 switch(msg){
				case "DR Exists": client.emit('objjobs',"Data Raptor Doesn't Exist");client.emit('objjobserr',"Data Raptor Doesn't Exist");client.emit('objjobs','Checking DR is Done');break;
				case "ExtractDRperformop":client.emit('objjobs','Starting operations for Extract DR');client.emit('objjobserr','Starting operations for Extract DR');break;
				case "OmniscriptsExists":client.emit('objjobs',"Omniscript Doesn't Exits"+JSON.stringify(resp,null,2));client.emit('objjobserr',"Omniscript Doesn't Exits");client.emit('objjobs','Checking Omniscript is Done');break;
				case "DRqueries":client.emit('objjobs','DR query failed'+JSON.stringify(resp,null,2)+',this could be due to field level security as wel');client.emit('objjobs','DR query is failed');break;
				case "OmniScriptperformop":client.emit('objjobs','Starting operations for Omniscript');client.emit('objjobserr','Starting operations for Omniscript');break;
			}
			 }
				console.log(msg);
		});
	});
	qryObj.on('error',(e)=>{
		console.log('problemquery',e);
		client.emit('objjobs','There is a problem with request');
		client.emit('objjobserr','There is a problem with request');
	});
	qryObj.end();
};

var OmniScriptperformop=(resp,client)=>{
	var sample={};
	for (var i=0;i<resp.records.length;i++){
		//console.log(resp.records[i].Name,true);
		sample[resp.records[i].Name]=true;
		propset=JSON.parse(resp.records[i]["vlocity_cmt__PropertySet__c"]);
		client.emit('objjobs','Checking Node '+resp.records[i].Name);
		client.emit('objjobs','Type '+resp.records[i]["vlocity_cmt__Type__c"]);
		switch(resp.records[i]["vlocity_cmt__Type__c"]){
			case "Remote Action":
								
								if(propset.responseJSONNode && sample[propset.responseJSONNode]===undefined){
									//console.log(sample,sample[propset.responseJSONNode],resp.records[i].Name,propset.responseJSONNode,'sample');
									sample[propset.responseJSONNode]=false;
								}
								if(propset.preTransformBundle|| propset.postTransformBundle){
									getObjectDetails("DataRaptor",propset.preTransformBundle!==""?propset.preTransformBundle:propset.postTransformBundle,client);
								}
								break;
			case "DataRaptor Extract Action":
										if(propset.bundle){
											getObjectDetails("DataRaptor",propset.bundle,client);
										}
										break;
		}
	}
	for (i in sample){
		//console.log(sample[i],i);
		if (sample.hasOwnProperty(i) && sample[i]===false){
			client.emit('objjobs',i+'is not existing but used');
		client.emit('objjobserr',i+'is not existing but used');
			console.log(i,'is not existing but used');
		}
		else{
			client.emit('objjobs','Checked Node'+i);
		}
	}
	client.emit('objjobs','Checking Omniscript is Done');
}
var OmniScriptcheckactiveversion=(name,client)=>{
  q1="select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+Where+Name='"+name.replace(/\s/g,'+')+"'+and+vlocity_cmt__IsActive__c=true";
	client.emit('objjobs','Checkign for active version');
	RestCallMapper(q1,'OmniscriptsExists',name,client);
}
var OmniscriptsExists=(name,client)=>{
  tq="select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+Where+Name='"+name.replace(/\s/g,'+')+"'";
  client.emit('objjobs','Checking if Omniscript is present');
  RestCallMapper(tq,'CheckOmniscriptsExists',name,client);
	
}
var getOmniScriptDetails=(resp,client)=>{
	try{
	if(resp.totalSize>0){
		q2="select+Name,vlocity_cmt__Type__c,vlocity_cmt__PropertySet__c,vlocity_cmt__Level__c,vlocity_cmt__Active__c,Id+from+vlocity_cmt__Element__c+where+vlocity_cmt__OmniScriptId__c='"+resp.records[0].Id+"'+ORDER+BY+vlocity_cmt__Level__c,vlocity_cmt__Order__c";
		client.emit('objjobs',"Starting to  perform operations on Omniscript Id"+resp.records[0].Id);
		RestCallMapper(q2,'OmniScriptperformop',null,client);
	}
	else{// NO RECORDS
	client.emit('objjobs',"Omniscript is either not active or doesn't exist");
		client.emit('objjobserr',"Omniscript is either not active or doesn't exist");
		console.log("Omniscript is either not active or doesn't exist");
	}
	}
	catch(e){
		client.emit('objjobs',"Error Occured"+e);
		client.emit('objjobserr',"Error Occured"+e);
	}
}

var drtype=(lis,name,client)=>{
	try{
	switch(lis[0]['vlocity_cmt__Type__c']){
		case "Extract":
		case "Extract (JSON)":
			q2="select+vlocity_cmt__FilterOperator__c,vlocity_cmt__FilterValue__c,vlocity_cmt__FilterGroup__c,vlocity_cmt__InterfaceFieldAPIName__c,vlocity_cmt__InterfaceObjectName__c,vlocity_cmt__DomainObjectFieldAPIName__c+from+vlocity_cmt__DRMapItem__c+where+Name=+'"+name+"'";//get required values
			client.emit('objjobs',"Type of DR is Extract");
			client.emit('objjobs',"Getting Required DR vlaues by "+q2);
			RestCallMapper(q2,'ExtractDRperformop',null,client);break;
    default:
      client.emit('objjobs',"Type of DR is"+lis[0]['vlocity_cmt__Type__c'] );
      client.emit('objjobs',"Checking of DR is Done");
			
	}
	}
	catch(e){
		client.emit('objjobs',"Error Occured "+e);
		client.emit('objjobserr',"Error Occured "+e);
	}
}
var ExtractDRperformop=(lis,client)=>{
	try{
	var sample={},
	holder={},
	temp=[],
	a='',b='';
	for (var i=0;i<lis.length;i++){
				if(lis[i]['vlocity_cmt__FilterOperator__c'] !=null){
					a=lis[i]["vlocity_cmt__InterfaceObjectName__c"];
					b=lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"];
					holder[lis[i]["vlocity_cmt__DomainObjectFieldAPIName__c"]]=a;
				}
				if(b && !b.match(/\[/i)){
				if(sample.hasOwnProperty(a)){
						if(!sample[a].match(b)){
						sample[a]+=','+b;}
					}
					else{
						sample[a]=b;
					}
				}
			}
	for (var i=0;i<lis.length;i++){
				if(lis[i]['vlocity_cmt__FilterOperator__c'] ===null){
					//console.log(lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"],lis[i]);
					temp=lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"].split(":");
					a=holder[temp[0]];
					b=temp[1];
				}
				if(b && !b.match(/\[/i)){
				if(sample.hasOwnProperty(a)){
						if(!sample[a].match(b)){
						sample[a]+=','+b;}
					}
					else{
						sample[a]=b;
					}
				}
			}
	console.log(sample,holder);
	 for (i in sample){
		//console.log('fdf',i);
		if(sample[i] && i){
		var tempquery='select+'+sample[i]+'+from+'+i+'+LIMIT+1';
		console.log('tempquery',tempquery);
		client.emit('objjobs',"Checking whether Fields "+sample[i]+" are present in "+i);
		RestCallMapper(tempquery,'DRqueries',null,client);
		}
	}
client.emit('objjobs','Checking DR is Done');	
	}
	catch(e){
		client.emit('objjobs',"Error Occured "+e);
		client.emit('objjobserr',"Error Occured "+e);
	}
}
var DRExists=(name,client)=>{
	q1="select+Id,vlocity_cmt__Type__c+from+vlocity_cmt__DRBundle__c+where+Name+=+'"+name.replace(/\s/g,'+')+"'";//Check DR is created
	client.emit('objjobs',"Checking DR Exists ");
	RestCallMapper(q1,'DR Exists',name,client);
}

var getObjectDetails=(bundle,name,client)=>{//Gettign Object Details
	//console.log(bundle,name);
	client.emit('objjobs',"Type of Object is "+bundle);
	client.emit('objjobs',"Object's Name is "+name);
	switch (bundle){
	case "DataRaptor":DRExists(name,client);break;
	case "OmniScript":OmniscriptsExists(name,client);break;
	default:objectexists(bundle,name,client);
	}
}
io.on('connection', (client)=> {  
    console.log('Client connected...');
	client.emit('username', username);
    client.on('join', (data)=> {
        console.log(data);
		client.emit('broad', data);
    });
f='d';
    client.on('joined', (data)=> {
           client.emit('broad', Number(data)+10);
           //client.broadcast.emit('broad',data);
    });
	client.on('sfdcdetails', (data)=> {
           console.log('sfdc',data);
		   console.log('came here1');
		   client.emit('sfdccoms', 20);
		   client.emit('sfdccomslog', 'Execution Started');
	var headers={
		'Content-Type':'application/json'
	},
	data={
		'grant_type':'password',
		'client_id':data.clientid,
		'client_secret':data.clientsecret,
		'username':data.username,
		'password':data.password
	};
	client.emit('sfdccoms', 30);
	client.emit('sfdccomslog', 'Reading of Details is Done');
	var host=data.env=="Production"?'login.salesforce.com':'test.salesforce.com',
	endpoint = '/services/oauth2/token?'+querystring.stringify(data);
	console.log(data['client_id'],data['username'],data['password']);
	var options={
		host:host,
		port:null,
		path:endpoint,
		method:'POST',
		headers:headers
	};
	console.log('came hhh');
	client.emit('sfdccomslog', 'endpoint url is formed');
	client.emit('sfdccoms', 40);
	var req=https.request(options,function(res){
		res.setEncoding('utf-8');
		var responseString='';
		client.emit('sfdccoms', 50);
		res.on('data',function(respObj){
			responseString+=respObj;
		});
		client.emit('sfdccoms', 70);
		res.on('end',function(){
			try{
			console.log('rstring',responseString);
			var responseObject=JSON.parse(responseString);
			//console.log(responseObject);
			client.emit('sfdccomslog', ' response object is '+JSON.stringify(responseObject,null,2));
			access_token=responseObject.token_type+' '+responseObject.access_token;
			instance_url=responseObject.instance_url.split('/')[2];
			client.emit('sfdccoms', 100);
			if(access_token){
				console.log('connection'+'established');
			client.emit('sfdccomslog', 'Connection Established');}
			//getObjectDetails(v3,v4);
			}
			catch(e){
				console.log('error',e);
				client.emit('sfdccomslog','There is an Error'+e);
			}
		});
		
	});
	req.on('error',(e)=>{
		client.emit('sfdccomslog','Problem with Request'+e);
		console.log('problem'+e);
	});
	req.end();
    });
	
	client.on('sfdcobjdetails', (data)=> {
        console.log(data);
		getObjectDetails(data.selectedName,data.objname,client);
    });
});

server.listen(process.env.PORT || 4200); 
