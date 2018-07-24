var express = require('express'),
app = express(),  
server = require('http').createServer(app),  
bodyParser = require('body-parser'),
querystring=require('querystring'),
https=require('https'),
request = require('request'),
username='',
access_token='',
access_token='',
instance_url='',
squery='/services/data/v42.0/query/?q=';

app.use(express.static(__dirname + '/node_modules'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

var restcallmapperapi=(query,callback)=>{
	var temp={"error":false};
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
			console.log('respo',resp.done,resp.totalSize,resp);
			if(resp.done && resp.totalSize>0){
				temp["data"]=resp;
			}
			else{
				temp["error"]=true;
			}
			callback(null,temp);
		});
	});
	qryObj.on('error',(e)=>{
		console.log('problemquery',e);
		callback('error in query object request '+e);
	});
	qryObj.end();
};
var namingconventioncheckapi=(name)=>{//Checking Naming Convention
			
	name.match("^([A-Z]+[a-z_0-9]*)+$")?true:false;
}
var isEmpty = (obj)=> {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
var drapi=(name)=>{
	var temp={"type":"","success":[],"error":[],"warning":[]};
async.waterfall([
(drapic)=>{
restcallmapperapi("select+Id,vlocity_cmt__Type__c,vlocity_cmt__OutputType__c,vlocity_cmt__UseAssignmentRules__c,vlocity_cmt__CheckFieldLevelSecurity__c,vlocity_cmt__SampleInputJSON__c+from+vlocity_cmt__DRBundle__c+where+Name+=+'" + name.replace(/\s/g, '+') + "'", drapic);//DR Exits
},(dt,drapic)=>{
	if (dt.error){
		drapic("Couldn't Find any DataRaptor with Given Name: "+name);
	}
	else{
		// DR Naming Convention Start
		if(namingconventioncheckapi(name)){//Checking Naming Convention
		temp["success"].push("Naming Convention for "+name+" is followed");
		}
		else{
			temp["error"].push("Naming Convention for "+name+" is not followed");
		}
		//DR Naming Convention End
		//dt.data.records
		//Capturing Type 
		temp.type=dt.data.records[0]['vlocity_cmt__Type__c'];
		switch(temp.type){
		case "Extract":
		case "Extract (JSON)":
						//Sample Input JSON DR Preview Start
						if(isEmpty(JSON.parse(dt.data.records[0]['vlocity_cmt__SampleInputJSON__c']))){
							temp["error"].push("Sample Input JSON for "+name+" is NULL,Execute DR preview atleast once for valid value");
						}
						else{
							temp["success"].push("Sample Input JSON for "+name+" is Not NULL");
						}
						//Sample Input JSON DR Preview End
						//Checking FieldLevel Security Checkbox Start
						if(dt.data.records[0]["vlocity_cmt__CheckFieldLevelSecurity__c"]===true){
							temp["success"].push("FieldLevel Security Checkbox "+name+" is Checked");
						}
						else{
							temp["error"].push("FieldLevel Security Checkbox "+name+" is not Checked");
						}
						//Checking FieldLevel Security Checkbox End
						//Query for getting Required Vals Start
						restcallmapperapi("select+vlocity_cmt__FilterOperator__c,vlocity_cmt__FilterValue__c,vlocity_cmt__FilterGroup__c,vlocity_cmt__InterfaceFieldAPIName__c,vlocity_cmt__InterfaceObjectName__c,vlocity_cmt__DomainObjectFieldAPIName__c+from+vlocity_cmt__DRMapItem__c+where+Name=+'"+name.replace(/\s/g,'+')+"'",drapic);
						//Query for getting Required Vals End
						break;
		case "Load":
						//Checking Assignement Rules Start
						if(dt.data.records[0]["vlocity_cmt__OutputType__c"]==="SObject"){
							if(dt.data.records[0]["vlocity_cmt__UseAssignmentRules__c"]===true ){
								temp["success"].push("Assignement Rules Checkbox "+name+" is Checked");
							}
							else{
								temp["warning"].push("Assignement Rules Checkbox "+name+" is not Checked");
							}
						}
						//Checking Assignement Rules End
						//Query for getting Required Vals Start
						restcallmapperapi("select+vlocity_cmt__DomainObjectFieldAPIName__c,vlocity_cmt__DomainObjectAPIName__c,vlocity_cmt__UpsertKey__c+from+vlocity_cmt__DRMapItem__c+where+Name=+'"+name.replace(/\s/g,'+')+"'",drapic);
						//Query for getting Required Vals End
						break;
			default:
			drapic(null,null);
		}
	}
},(dt,drapic)=>{
	if(!dt)
		drapic(null,null)
	else{
		//DR query may be correct but to perform any operation no records returned . Please Fill some fields and excute the task again
		switch(temp.type){
		case "Extract":
		case "Extract (JSON)":
					if (dt.error){
							drapic("DR query may be correct but to perform any operation no records returned . Please Fill some fields and excute the task again for DataRaptor with Given Name: "+name);
						}
					else{
							// Extract DR perform Operations Start
								var sample={},
								holder={},
								extracrtdrtemp=[],
								a='',b='',lis=dt.data.records,q=[];
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
											if(lis[i]['vlocity_cmt__FilterOperator__c'] ===null && lis[i]['vlocity_cmt__DomainObjectFieldAPIName__c']!=="Formula"){
												//console.log(lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"],lis[i]);
												try{
												console.log(lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"],lis[i]);
												var extracrtdrtemp=lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"].lastIndexOf(":");
												if (extracrtdrtemp!==-1){
												a=holder[lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"].substring(0,extracrtdrtemp)];
												b=lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"].substring(extracrtdrtemp+1,);}
												}
												catch(e){
													temp["error"].push("Issue with current JSON Node of "+name+" JSON is "+JSON.stringify(lis[i],null,2));
												}
												
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
									if(sample.hasOwnProperty(i)){
										console.log('select+'+sample[i]+'+from+'+i+'+LIMIT+1');
									q.push('select+'+sample[i]+'+from+'+i+'+LIMIT+1');
									//RestCallMapper(tempquery,'DRqueries',null,client);
									}
								}
								
							// Extract DR Perform Operations End
					}
					break;
		case "Load":break;
	}
}

],(err,res)=>{
	temp["error"].push(err);
	return [name,temp];
};
var apihandshake= (data,asyncc)=>{
	         console.log('sfdc',data);
		   console.log('came here1');
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
	var req=https.request(options,function(res){
		res.setEncoding('utf-8');
		var responseString='';
		res.on('data',function(respObj){
			responseString+=respObj;
		});
		res.on('end',function(){
			try{
			console.log('rstring',responseString);
			var responseObject=JSON.parse(responseString);
			access_token=responseObject.token_type+' '+responseObject.access_token;
			instance_url=responseObject.instance_url.split('/')[2];
			if(access_token){
				console.log('connection'+'established');
				asyncc(null);
			}
			}
			catch(e){

				console.log('error',e);
				asyncc('error in response '+e);
			}
		});
		
	});
	req.on('error',(e)=>{
		console.log('problem'+e);
		asyncc('error in request '+e);
	});
	req.end();
	
};
var asyncopps=(webresponse,i)=>{
	async.waterfall([
(asyncc)=>{//sfdc handshake
	apihandshake(i.sfdcdetails,asyncc);
},(asyncc)=>{//seggregate opps
	switch (i.obj.type){
	case "DataRaptor":
						var temp2=drapi(i.obj.name);
						asyncc(null,{temp2[0]:temp2[1]});
						break;
	/*case "OmniScript":
	case "Integration_Prodecure":
	case "IntegrationProcedure":
	OmniscriptsExists(name,bundle,client);break;
	default:objectexists(bundle,name,client);*/
	}
},(temp1,asyncc)=>{
	temp1["error"]=[];
	temp1["warning"]=[];
	var recurobjs=(objs)=>{
	for (k in objs){
		if(objs.hasOwnProperty(k)){
			if(typeof(objs[k])=="Object"){
				if(objs[k].hasOwnProperty("error")){
					temp1["error"].push.apply(temp1["error"], objs[k]["error"]);
				}
				if(objs[k].hasOwnProperty("warning")){
					temp1["warning"].push.apply(temp1["warning"], objs[k]["warning"]);
				}
				recurobjs(objs[k]);
			}
		}
	}
	};
	recurobjs(temp1);
},

],(err,res)=>{
	webresponse.setHeader('Access-Control-Allow-Origin', '*');
	webresponse.json(err?err:res);
	webresponse.end();

});

}

app.post('/', (req, res,next) =>{  
//username=req.body.username;
console.log(JSON.stringify(req.body));
for (i in req.body){
		i=JSON.parse(i);
		asyncopps(res,i);
		/*res.setHeader('Access-Control-Allow-Origin', '*');
			res.send({'cx':'cxd'});
			res.end();*/
		
	}
});

server.listen(process.env.PORT || 4200); 
