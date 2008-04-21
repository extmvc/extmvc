/* EXAMPLE OF HOW TO SET UP A MODEL, REMOVE IF NOT REQUIRED */

var UserRecord = Ext.data.Record.create([
  { name: 'id',         type: 'int'},
  { name: 'login',      type: 'string'},
  { name: 'email',      type: 'string'},
  { name: 'first_name', type: 'string'},
  { name: 'last_name',  type: 'string'}
]);

var UserReader = new Ext.data.JsonReader({root: 'users',totalProperty: 'results'}, UserRecord);
var User = {model_name : 'user'};
Ext.apply(User, Model);
User.init();