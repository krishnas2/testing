({
	getAllTasks : function(component, event, helper) {
		var action = component.get("c.gettasks");
        action.setParams({
            "s":component.get("v.rels")
        });
        action.setCallback(this, function(a){
            component.set("v.contactRows", a.getReturnValue());
        });
        $A.enqueueAction(action);
	}
})
