DashboardIndexPanel = function() {
  return new Ext.Panel({
    title: 'Dashboard',
    autoScroll: true,
    iconCls: 'dashboard',
    frame: true,
    autoLoad: '/admin/dashboard'
  });
};