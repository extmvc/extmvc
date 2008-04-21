// Set up EXT
Ext.BLANK_IMAGE_URL = '/images/s.gif';
Ext.QuickTips.init();

Ext.state.Manager.setProvider(new Ext.state.CookieProvider());

//set up some global configs
Ext.form.Field.prototype.msgTarget = 'side';
Ext.form.FormPanel.prototype.bodyStyle = 'padding: 5px';
Ext.Panel.prototype.height = "100%";
Ext.Panel.prototype.frame = false;
Ext.grid.GridPanel.prototype.frame = false;
Ext.form.FieldSet.prototype.bodyStyle = 'padding: 5px; margin: 5px;';
Ext.ux.menu.RangeMenu.prototype.icons = {gt: '/images/greater_than.png', lt: '/images/less_than.png',eq: '/images/equals.png'};
Ext.ux.grid.filter.StringFilter.prototype.icon = '/images/find.png';