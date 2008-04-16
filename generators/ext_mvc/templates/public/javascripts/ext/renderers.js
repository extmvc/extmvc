function renderCurrency (v, symbol){
  
  if (symbol == null) {
    symbol = "£";
  };
  
  v = (Math.round((v-0)*100))/100;
  v = (v == Math.floor(v)) ? v + ".00" : ((v*10 == Math.floor(v*10)) ? v + "0" : v);
  v = String(v);
  var ps = v.split('.');
  var whole = ps[0];
  var sub = ps[1] ? '.'+ ps[1] : '.00';
  var r = /(\d+)(\d{3})/;
  while (r.test(whole)) {
      whole = whole.replace(r, '$1' + ',' + '$2');
  }
  v = whole + sub;
  if(v.charAt(0) == '-'){
      return '-' + symbol + v.substr(1);
  }
  return symbol +  v;
}

function ukMoney (amount) {
  return renderCurrency(amount);
}