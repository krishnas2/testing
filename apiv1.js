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
var typesubtypequeryapi=(name)=>{
	var temp=name.lastIndexOf('_');
	console.log(name.substring(0,temp),name.substring(temp+1,));
	return "select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+where+vlocity_cmt__Type__c='"+name.substring(0,temp)+"'+and+vlocity_cmt__SubType__c='"+name.substring(temp+1,)+"'";
};
var drapi=(name)=>{
	var temp={"type":"","success":[],"error":[],"warning":[]};
async.waterfall([
(drapic)=>{
restcallmapperapi("select+Id,vlocity_cmt__Type__c,vlocity_cmt__OutputType__c,vlocity_cmt__UseAssignmentRules__c,vlocity_cmt__CheckFieldLevelSecurity__c,vlocity_cmt__SampleInputJSON__c+from+vlocity_cmt__DRBundle__c+where+Name+=+'" + name.replace(/\s/g, '+') + "'", drapic);//DR Exits
},
(dt,drapic)=>{
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
								//Execute REST Call for each Start
								async.map(q, (val,childcallback)=>{//WIP
									restcallmapperapi(val,childcallback);
								}, (err,result)=>{
									// i want result of each call
								});
								// Execute REST Call for Each End
							// Extract DR Perform Operations End
					}
					break;
		case "Load":break;
	}
}
}
],(err,res)=>{
	if(err){
		temp["error"].push(err);}
	return [name,temp];
});
};
var omniscriptapi=(bundle,name)=>{
	var temp={"type":"","success":[],"error":[],"warning":[]};
	async.waterfall([
	(omnicallback)=>{
		restcallmapperapi(bundle==='IntegrationProcedure'?typesubtypequery(name):"select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+Where+Name='"+name.replace(/\s/g,'+')+"'",omnicallback);//Omniscript Exits
	},
	(dt,omnicallback)=>{
		if(dt.error){
			omnicallback("Couldn't Find any "+bundle+" with Given Name: "+name);
		}
		else{
			// Omniscript Naming Convention Start
			if(namingconventioncheckapi(name)){//Checking Naming Convention
			temp["success"].push("Naming Convention for "+name+" is followed");
			}
			else{
				temp["error"].push("Naming Convention for "+name+" is not followed");
			}
			//Omniscript Naming Convention End
			//Omniscript Active Version query
			restcallmapperapi("select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+Where+Name='"+name.replace(/\s/g,'+')+"'+and+vlocity_cmt__IsActive__c=true",omnicallback);
		}
	},
	(dt,omnicallback)=>{
		//Active Version Check Start
		if(dt.error){
			omnicallback("Couldn't Find any Active version"+bundle+" with  Name: "+name);
		}
		else{
			temp["success"].push("Active Version of"+bundle+ " with name "+name+" is Present");
			//Active Version Check End
			//Getting values from vlocity_cmt__Element__c using Omniscript Id
			restcallmapperapi("select+Name,vlocity_cmt__Type__c,vlocity_cmt__PropertySet__c,vlocity_cmt__Level__c,vlocity_cmt__Active__c,Id+from+vlocity_cmt__Element__c+where+vlocity_cmt__OmniScriptId__c='"+dt.data.records[0].Id+"'+ORDER+BY+vlocity_cmt__Level__c,vlocity_cmt__Order__c",omnicallback);
		}
	},
	(dt,omnicallback)=>{
		//Omniscript Element Check Start
		if(dt.error){
			omnicallback("Couldn't Any Elements for "+bundle+" with  Name: "+name+ " Fill the omniscript with atleast one item");
		}
		else{
							var sample={};
							var i1=0,i2=0,resp=dt.data,valholder=[];
							for (var i=0;i<resp.records.length;i++){
								if(resp.records[i]["vlocity_cmt__Active__c"]){
								sample[resp.records[i].Name]=true;
								propset=JSON.parse(resp.records[i]["vlocity_cmt__PropertySet__c"]);
								switch(resp.records[i]["vlocity_cmt__Type__c"]){
									case "Response Action":i1+=1;break;
									case "Step":i2+=1;break;
									case "OmniScript":
													valholder=omniscriptapi('OmniScript',resp.records[i].Name);
													temp[valholder[0]]=valholder[1];
													break;
									case "Integration Procedure Action":
													valholder=omniscriptapi('IntegrationProcedure',propset.integrationProcedureKey);
													temp[valholder[0]]=valholder[1];
												break;
									case "Remote Action":
														
														if(propset.responseJSONNode && sample[propset.responseJSONNode]===undefined && propset.responseJSONNode!="vlcCart"){//Check for persistent component should be made dynamic
															//Saving response JSON Node Name for Refrencing in Selectable Items
															sample[propset.responseJSONNode]=false;
														}
														if(propset.preTransformBundle|| propset.postTransformBundle){
															valholder=drapi(propset.preTransformBundle!==""?propset.preTransformBundle:propset.postTransformBundle);
															temp[valholder[0]]=valholder[1];
														}
														break;
									case "DataRaptor Extract Action":
									case "DataRaptor Post Action":
									case "DataRaptor Transform Action":
																if(propset.bundle){
																	valholder=drapi(propset.bundle);
																	temp[valholder[0]]=valholder[1];
																}
																break;
								}
							}
							}
							if (i2===0){
								//Chekcing for Response Action
								if(i1===0){
									temp["error"].push("There is no Response Action for "+bundle+ " with name "+name);
								}
								else{
									temp["error"].push(" Response Action for "+bundle+ " with name "+name+" is present");
								}
							}
							for (i in sample){
								//console.log(sample[i],i);
								if (sample.hasOwnProperty(i) && sample[i]===false){
									temp["error"].push("The JSON Node "+ i +" is not existing but used in Remote Action for "+bundle+ " with name "+name);
									console.log(i,' is not existing but used');
								}
								/* else{
									client.emit('objjobs','Checked Node'+i);
								} */
							}
							omnicallback(null);
		}
	}
	
	],(err,res)=>{
		if(err){
		temp["error"].push(err);}
		return [name,temp];
	});
	
};
var genericobjectops=(bundle,name)=>{
	var temp={"type":"","success":[],"error":[],"warning":[]};
	temp.type=bundle;
	async.waterfall([
	(genericcallback)=>{
		restcallmapperapi("select+Id+from+vlocity_cmt__"+bundle+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'",genericcallback);//Object Exits
	},
	(dt,genericcallback)=>{
		if(dt.error){
			genericcallback("Couldn't Find any "+bundle+" with Given Name: "+name);
		}
		else{
			//Call for Active Version check Start
			switch(bundle){
							case "VlocityAction":restcallmapperapi("select+Id+from+vlocity_cmt__"+bundle+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'+and+vlocity_cmt__IsActive__c=true",genericcallback);
									break;
							case "VlocityUITemplate":
							case "VlocityCard":
							case "VlocityUILayout":
							restcallmapperapi("select+Id+from+vlocity_cmt__"+bundle+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'+and+vlocity_cmt__Active__c=true",genericcallback);
									break;
			}
			//Call for Active Version check End
		}
	},
	(dt,genericcallback)=>{
		if(dt.error){
			genericcallback("Couldn't Find any Active Version for "+bundle+" with Name: "+name);
		}
		else{
			temp["success"].push("Active Version for "+bundle+" with Name: "+name);
			// Generic Naming Convention Start
			if(namingconventioncheckapi(name)){//Checking Naming Convention
			temp["success"].push("Naming Convention for "+name+" is followed");
			}
			else{
				temp["error"].push("Naming Convention for "+name+" is not followed");
			}
			//Generic Naming Convention End
			switch(bundle){
				case "VlocityUITemplate":restcallmapperapi("select+vlocity_cmt__HTML__c,vlocity_cmt__CustomJavascript__c,vlocity_cmt__Sass__c,vlocity_cmt__CSS__c+from+vlocity_cmt__VlocityUITemplate__c+where+name+='"+name.replace(/\s/g,'+')+"'",genericcallback);break;
				case "VlocityAction":
				restcallmapperapi("select+vlocity_cmt__OpenURLMode__c,vlocity_cmt__LinkType__c,vlocity_cmt__URL__c,vlocity_cmt__UrlParameters__c,vlocity_cmt__DisplayOn__c+from+vlocity_cmt__"+"VlocityAction"+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'and+vlocity_cmt__IsActive__c=true",genericcallback);
									break;
				default:genericcallback(null);
			}
		}
		
	},
	(dt,genericcallback)=>{
		switch(bundle){
			case "VlocityAction":
										try{
											rec=dt.data.records[0];
											for (i in rec){
												if(rec.hasOwnProperty(i)){
													if(rec[i]!==null && rec[i]!='')
															temp["success"].push(i+ " is fine for Object "+object+ " of Name "+ name);
													else
														temp["error"].push(i+ " is fine for Object "+object+ " of Name "+ name);
												}
											}
											}
											catch(e){
												temp["error"].push(" Error for Object "+object+ " of Name "+ name+ "  "+e);
											}
											finally{
											genericcallback(null);
											}
									break;
			case "VlocityUITemplate":genericcallback(null);break;
			default:genericcallback(null);
		}
	}
	
	],(err,res)=>{
		if(err){
		temp["error"].push(err);}
		return [name,temp];
	});
};
var apihandshake= (data,asyncc)=>{
	         console.log('sfdc',data);
		   console.log('came here1');
	var headers={
		'Content-Type':'application/json'
	},
	dat={
		'grant_type':'password',
		'client_id':data.clientid,
		'client_secret':data.clientsecret,
		'username':data.username,
		'password':data.password
	};
	var host=data.env=="Production"?'login.salesforce.com':'test.salesforce.com',
	endpoint = '/services/oauth2/token?'+querystring.stringify(dat);
	console.log(dat['client_id'],dat['username'],dat['password']);
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
						var temp1={};
						temp1[temp2[0]]=temp2[1];
						asyncc(null,temp1);
						break;
	case "OmniScript":
	case "Integration_Prodecure":
	case "IntegrationProcedure":var temp2=omniscriptapi(i.obj.type,i.obj.name);
						var temp1={};
						temp1[temp2[0]]=temp2[1];
						asyncc(null,temp1);
							break;
	default:var temp2=genericobjectops(i.obj.type,i.obj.name);
						var temp1={};
						temp1[temp2[0]]=temp2[1];
						asyncc(null,temp1);
	}
},
(temp1,asyncc)=>{
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
	asyncc(null,temp1);
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
