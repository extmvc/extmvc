// /**
//  * An extension to Ext.extend which calls the extended object's onExtended function, if it exists
//  * The only lines that are different from vanilla Ext.extend are the 2 before the return sb statement
//  */
// Ext.extend = function(){
//     // inline overrides
//     var io = function(o){
//         for(var m in o){
//             this[m] = o[m];
//         }
//     };
//     var oc = Object.prototype.constructor;
//     
//     return function(sb, sp, overrides){
//         if(Ext.isObject(sp)){
//             overrides = sp;
//             sp = sb;
//             sb = overrides.constructor!= oc ? overrides.constructor : function(){sp.apply(this, arguments);};
//         }
//         var F = function(){},
//             sbp,
//             spp = sp.prototype;
// 
//         F.prototype = spp;
//         sbp = sb.prototype = new F();
//         sbp.constructor=sb;
//         sb.superclass=spp;
//         if(spp.constructor == oc){
//             spp.constructor=sp;
//         }
//         sb.override = function(o){
//             Ext.override(sb, o);
//         };
//         sbp.superclass = sbp.supr = (function(){
//             return spp;
//         });
//         sbp.override = io;
//         Ext.override(sb, overrides);
//         sb.extend = function(o){Ext.extend(sb, o);};
//         
//         var extendFunction = sb.prototype.onExtended;
//         if (extendFunction) extendFunction.call(sb.prototype);
//         
//         return sb;
//     };
// }();

// (function() {
//   var inlineOverrides = function(o) {
//     for(var m in o){
//       this[m] = o[m];
//     }
//   };
//   
//   //reference to the constructor of Object - we can match against this so as not to extend improperly
//   var objectConstructor = Object.prototype.constructor;
//   
//   /**
//    * Returns true if the given function is the bottom level Object object. We use this to test if we are
//    * extending Object directly, or some subclass of Object.
//    * @param {Object} superclass The superclass constructor function
//    */
//   var superclassIsObject = function(superclass) {
//     return superclass.prototype.constructor == objectConstructor;
//   };
//   
//   Ext.extend = function() {
//     //this method has two different signatures - 2 or 3 arguments
//     if (arguments.length == 3) {
//       // 3 arguments - where we're given the subclass constructor function, the superclass and some overrides
//       var subclassConstructor = arguments[0],
//           superclass          = arguments[1],
//           overrides           = arguments[2];
//     } else {
//       // 2 arguments - where we're just given the superclass and some overrides
//       var superclass          = arguments[0],
//           overrides           = arguments[1];
//       
//       // Because we weren't given a subclass constructor, make one now
//       var subclassConstructor = overrides.constructor == objectConstructor
//                               ? function(){superclass.apply(this, arguments);} //TODO: Explain this
//                               : overrides.constructor;
//     }
//     
//     //This is the beginnings of our new class - just an empty function for now
//     var F = function() {};
//     
//     //set our new class' prototype to the same as the superclass
//     F.prototype = superclass.prototype;
//     
//     // This is where the actual 'inheritance' happens. In JavaScript we extend objects by setting the prototype
//     // of a new object to an instance of an existing one
//     subclassConstructor.prototype =  new F();
//     
//     // We'll use the subclass and superclass prototypes a lot, so get references to them here
//     var subclassProto   = subclassConstructor.prototype,
//         superclassProto = superclass.prototype;
//     
//     //Tell our new subclass its constructor
//     subclassProto.constructor = subclassConstructor;
//     
//     //TODO: Here we're giving the subclass's constructor FUNCTION a supertype property, which is set to the prototype
//     //of the supertype... why?
//     subclassConstructor.superclass = superclass.prototype;
//     
//     // TODO: Explain this
//     if (superclassIsObject(superclass)) superclassProto.constructor = superclass;
//     
//     //This is what enables your to do things like MyExtendedClass.superclass.initComponent.apply(this, arguments);
//     subclassProto.superclass = subclassProto.supr = function() {
//       return superclassProto;
//     };
//     
//     subclassProto.override = inlineOverrides;
//     Ext.override(subclassConstructor, overrides);
//     
//     //Here we're adding override and extend to the constructor Function itself... for some reason (e.g. Ext.Window.override({}))
//     Ext.apply(subclassConstructor, {
//       extend: function(o){
//         Ext.extend(subclassConstructor, o);
//       },
//       override: function(o) {
//         Ext.override(subclassConstructor, o);
//       }
//     });
//     
//     return subclassConstructor;
//   };
// })();













