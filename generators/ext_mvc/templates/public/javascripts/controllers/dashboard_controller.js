var DashboardController = {
  viewIndex: function() {
    view = new DashboardIndexPanel();
    this.displayPanel(view);
  }
};
Ext.apply(DashboardController, ApplicationController);

// var DashboardController = Ext.apply(ApplicationController, {}, {
//   viewIndex: function() {
//     view = new DashboardIndexPanel();
//     this.displayPanel(view);
//   }
// });