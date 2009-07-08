Screw.Unit(function() {
  //keep track of the object to which models are currently assigned
  var ns = ExtMVC.model.modelNamespace;

  //Uses some test models set up in SpecHelper.js
  user = new ns.User({
    id:         100,
    first_name: 'William',
    last_name:  'Adama',
    email:      'adama@bsg.net'
  });
  
  blogPost = new ns.BlogPost({
    id:      1,
    user_id: 100,
    title:   'Test Post',
    content: "Frak the odds, we're going to find her"
  });
  
  describe("Models", function() {
    describe("when defining models", function() {
      before(function() {
        //we redefine these several times in these blocks so delete between each test
        delete ns.AnotherModel;
        delete ns.SpecialModel;
      });
      
      it("should create the model immediately if it does not extend any other models", function() {
        expect(typeof ns.AnotherModel).to(equal, "undefined");
        
        ExtMVC.model.define('AnotherModel', {fields: [{name: 'title', type: 'string'}]});
        expect(typeof ns.AnotherModel).to(equal, "function");
      });
      
      describe("when checking to see if the model has already been defined", function() {
        it("should return false when trying to define a new model", function() {
          expect(ExtMVC.model.isAlreadyDefined('MySuperModel')).to(equal, false);
        });
        
        it("should return true when trying to define a model that already exists", function() {
          expect(ExtMVC.model.isAlreadyDefined('User')).to(equal, true);
        });

        it("should return true when trying to define a model that is already in the pending creation queue", function() {
          //Add a fake model that depends on another model which hasn't yet been created
          ExtMVC.model.define("AnotherNewModel", {extend: "NonExistantModel"});
          
          //AnotherNewModel hasn't actually been created at this point
          expect(typeof ns.AnotherNewModel).to(equal, "undefined");
          expect(ExtMVC.model.isAlreadyDefined('AnotherNewModel')).to(equal, true);
        });        
      });
      
      describe("which extend other models", function() {
        after(function() {
          delete ns.RichUser; delete ns.AnotherModel;
        });
        
        it("should create the model immediately if it extends a model that has already been defined", function() {
          //make sure our superclass has been defined already
          expect(typeof ns.User).to(equal, "function");
          
          ExtMVC.model.define('RichUser', {extend: 'User', monies: 'many'});
          expect(typeof ns.RichUser).to(equal, "function");
        });
        
        it("should not create the model immediately if the model it extends has not yet been defined", function() {
          //make sure our superclass model hasn't been defined yet
          expect(typeof ns.SpecialModel).to(equal, "undefined");
          
          ExtMVC.model.define('AnotherModel', {fields: [{name: 'title', type: 'string'}], extend: 'SpecialModel'});
          
          expect(typeof ns.AnotherModel).to(equal, "undefined");
        });
        
        it("should add the create config to an internal object if the model it extends has not yet been defined", function() {
          var previousLength = ExtMVC.model.getModelsPendingDefinitionOf('SpecialModel').length;
          
          ExtMVC.model.define('AnotherModel', {fields: [{name: 'title', type: 'string'}], extend: 'SpecialModel'});
          
          var p = ExtMVC.model.getModelsPendingDefinitionOf('SpecialModel');
          expect(p.length).to(equal, previousLength + 1);
          expect(p[0].name).to(equal, 'AnotherModel');
        });
      });
    });
    
    describe("the pendingCreation queue", function() {
      //add a couple of fake configs to the queue...
      var peonUserConfig = {displayName: function() {return 'Peon';}};
      var noobUserConfig = {displayName: function() {return 'Noob';}};
      
      var m = ExtMVC.model;
      m.pendingCreation = {'User': [
        {name: 'PeonUser', config: peonUserConfig},
        {name: 'NoobUser', config: noobUserConfig}
      ]};
      
      it("should return an array of all model definitions waiting for the creation of a given model", function() {
        var p = ExtMVC.model.getModelsPendingDefinitionOf('User');
        
        expect(p.length).to(equal, 2);
        expect(p[0].name).to(equal, 'PeonUser');
        expect(p[1].name).to(equal, 'NoobUser');
      });
      
      it("should add model definition objects to the queue", function() {
        ExtMVC.model.setModelPendingDefinitionOf('User', 'NormalUser', {displayName: function() {return 'Normal';}});
        
        var p = ExtMVC.model.getModelsPendingDefinitionOf('User');
        expect(p.length).to(equal, 3);
        expect(p[2].name).to(equal, 'NormalUser');
      });
    });
    
    describe("when creating a model", function() {
      before(function() {
        ExtMVC.model.define('NewModel', {fields: [{name: 'name', type: 'string'}]});        
      });
      
      after(function() {
        delete ns.NewModel; delete ns.MyNewModel;
      });
      
      it("should create the model within ExtMVC.model.modelNamespace", function() {
        expect(typeof ns.MyNewModel).to(equal, 'undefined');
        ExtMVC.model.create('MyNewModel', {fields: [{name: 'title', type: 'string'}]});
        
        expect(typeof ns.MyNewModel).to(equal, 'function');
      });
      
      it("make all defined methods available on that model", function() {
        expect(typeof(user.displayName)).to(equal, "function");
      });
      
      it("should not make the special classMethods property available", function() {
        expect(typeof(user.classMethods)).to(equal, "undefined");
      });
      
      it("should add all classMethods to the model class instead of each instance", function() {
        expect(typeof(ns.User.testClassMethod)).to(equal, "function");
      });
      
      it("should default the primary key to 'id'", function() {
        expect(user.primaryKey).to(equal, 'id');
      });
      
      it("should allow specification of a different primary key to 'id'", function() {
        ExtMVC.model.create("SpecialModel", {
          fields:     [{name: 'someField', type: 'string'}],
          primaryKey: 'someField'
        });
        
        var special = new ns.SpecialModel({someField: 'someValue'});
        
        expect(special.primaryKey).to(equal, 'someField');
      });
      
      // it("should set its modelClass property as a reference to the class definition", function() {
      //   expect(user.modelClass).to(equal, ns.User);
      // });
      
      it("should inherit all functions from Ext.data.Record", function() {
        var funcs = ['beginEdit', 'cancelEdit', 'clearError', 'commit', 'copy', 'endEdit', 'get',
                     'getChanges', 'hasError', 'isModified', 'join', 'override', 'reject', 'set'];

        var myInstance = new ns.NewModel({name: 'Ed'});
        
        Ext.each(funcs, function(functionName) {
          expect(typeof myInstance[functionName]).to(equal, "function");
        }, this);
      });
      
      it("should inherit all properties from Ext.data.Record", function() {
        var props = ['dirty', 'editing', 'error', 'id', 'modified'];
        
        var myInstance = new ns.NewModel({name: 'Ed'});
        
        Ext.each(props, function(propertyName) {
          expect(typeof myInstance[propertyName]).to_not(equal, "undefined");
        }, this);
      });
    });
    
    describe("after creation", function() {
      it("should check the pending creation array and create any models that depended on this model's existence", function() {
        //TODO: Work out how to test that getModelsPendingDefinitionOf has definitely been called here
        
      });
    });
    
    describe("A Model instance", function() {
      var newUser = new ns.User({
        first_name: 'Saul',
        last_name:  'Tigh',
        email:      'saul@tigh.net'
      });
      
      describe("which has not yet been saved for the first time (has no primary key set yet)", function() {
        it("should should return true to newRecord()", function() {
          expect(newUser.newRecord()).to(equal, true);
        });
        
        it("should assign constructor parameters to the data object like a normal Ext.data.Record", function() {
          expect(newUser.data.first_name).to(equal, 'Saul');
          expect(newUser.data.last_name).to(equal, 'Tigh');
          expect(newUser.data.email).to(equal, 'saul@tigh.net');
        });
      });
      
      describe("name functions", function() {
        var lmn;
        
        before(function() {
          ExtMVC.model.define("LongModelName", {fields: [{}]});
          lmn = new ns.LongModelName({});
        });
        
        after(function() {
          delete ns.LongModelName;
        });
        
        it("should keep the modelName as defined", function() {
          expect(newUser.modelName).to(equal, 'User');
          expect((new ns.BlogPost()).modelName).to(equal, 'BlogPost');
        });
        
        it("should return a tablename based on the model name", function() {
          expect(newUser.tableName).to(equal, 'users');
          expect(lmn.tableName).to(equal, 'long_model_names');
        });
        
        it("should return a foreignKeyName based on the model name", function() {
          expect(newUser.foreignKeyName).to(equal, "user_id");
          expect(lmn.foreignKeyName).to(equal, 'long_model_name_id');
        });
      });
      
      describe("which has already been saved (has a primary key set)", function() {
        var existingUser = new ns.User({
          first_name: 'Kara',
          last_name:  'Thrace',
          email:      'starbuck@bsg.net',
          id:         1
        });
        
        it("should return false to newRecord()", function() {
          expect(existingUser.newRecord()).to(equal, false);
        });
      });
    });
    
    describe("Extending another Model", function() {
      ExtMVC.model.define("SuperUser", {
        extend: 'User',
        fields: [
          {name: 'is_admin',   type: 'boolean'},
          {name: 'password',   type: 'string'},
          
          //here we are _re_defining User's email property to be a number
          {name: 'email',      type: 'number'}
        ],
        
        //overwrite superclass's version of this instance method
        earlyJoiner: function() {
          return true;
        },
        
        classMethods: {
          //overwrite superclass's version of this class method
          methodToOverwrite: function() {
            return false;
          }
        }
      });
      
      var su = ns.SuperUser;
      var newSu = new ns.SuperUser({first_name : 'Ed', last_name: 'Spencer'});
            
      it("should inherit fields from the superclass", function() {
        var superFieldCount = ns.User.prototype.fields.getCount();
        var f = ns.SuperUser.prototype.fields;
        
        //we added two additional fields in SuperUser definition (email is a _re_definition)
        expect(f.getCount()).to(equal, superFieldCount + 2);
      });
      
      it("should overwrite any conflicting fields", function() {
        var email = ns.SuperUser.prototype.fields.get('email');
        
        expect(email.type).to(equal, "number");
      });
      
      it("should not overwrite the superclass's fields", function() {
        var email = ns.User.prototype.fields.get('email');
        
        expect(email.type).to(equal, "string");
      });
      
      it("should inherit instance methods from the superclass", function() {
        expect(newSu.displayName()).to(equal, "Ed Spencer");
      });
      
      it("should overwrite conflicting instance methods", function() {
        //the superclass' earlyJoiner method return false, test that this is overriden by subclass
        expect(newSu.earlyJoiner()).to(equal, true);
      });
      
      it("should not overwrite the superclass's conflicting instance methods", function() {
        newUser = new ns.User({id: 200});
        expect(newUser.earlyJoiner()).to(equal, false);
      });
      
      it("should inherit class methods from the superclass", function() {
        expect(typeof ns.SuperUser.testClassMethod).to(equal, "function");
      });
      
      it("should overwrite conflicting class methods", function() {
        expect(ns.SuperUser.methodToOverwrite()).to(equal, false);
      });
      
      it("should not overwrite the superclass's conflicting class methods", function() {
        expect(ns.User.methodToOverwrite()).to(equal, true);
      });
    });
    
    describe("Plugins", function() {
      var initializeCalled,
          myPlugin = { initialize: Ext.emptyFn };
      
      var normalPlugins = ExtMVC.model.plugins;
      
      before(function() {
        //clear out all plugins between tests
        ExtMVC.model.plugins = [];
      });
      
      after(function() {
        ExtMVC.model.plugins = normalPlugins;
      });
      
      it("should allow specification of new plugins", function() {
        var p = ExtMVC.model.plugins;
        expect(p.length).to(equal, 0);
        
        ExtMVC.model.addPlugin(myPlugin);
        expect(p.length).to(equal, 1);
      });
      
      it("should call each plugin's initialize method when a model is created", function() {
        initializeCalled = false;
        var initializeArgument;
        
        //set up a fake plugin initializer to check that we're receiving a reference to the model
        myPlugin.initialize = function(model) {
          initializeCalled = true;
          initializeArgument = model;
        };
                
        ExtMVC.model.addPlugin(myPlugin);
        
        ExtMVC.model.define('AnotherModel', {fields: []});
        expect(initializeCalled).to(equal, true);
        expect(initializeArgument).to(equal, ns.AnotherModel);
        
        delete ns.AnotherModel;
      });
    });
  });
});