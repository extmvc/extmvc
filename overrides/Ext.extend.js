/**
 * An extension to Ext.extend which calls the extended object's onExtended function, if it exists
 * The only lines that are different from vanilla Ext.extend are the 2 before the return sb statement
 */
Ext.extend = function(){
    // inline overrides
    var io = function(o){
        for(var m in o){
            this[m] = o[m];
        }
    };
    var oc = Object.prototype.constructor;

    return function(sb, sp, overrides){
        if(Ext.isObject(sp)){
            overrides = sp;
            sp = sb;
            sb = overrides.constructor!= oc ? overrides.constructor : function(){sp.apply(this, arguments);};
        }
        var F = function(){},
            sbp,
            spp = sp.prototype;

        F.prototype = spp;
        sbp = sb.prototype = new F();
        sbp.constructor=sb;
        sb.superclass=spp;
        if(spp.constructor == oc){
            spp.constructor=sp;
        }
        sb.override = function(o){
            Ext.override(sb, o);
        };
        sbp.superclass = sbp.supr = (function(){
            return spp;
        });
        sbp.override = io;
        Ext.override(sb, overrides);
        sb.extend = function(o){Ext.extend(sb, o);};
        
        var extendFunction = sb.prototype.onExtended;
        if (extendFunction) extendFunction.call(sb.prototype);
        
        return sb;
    };
}();