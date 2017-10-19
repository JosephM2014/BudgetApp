// APP LOGIC CONTROLLER
var AppController = (function(){
  // constructor function for an item
  var Item = function(id, amount, desc){
    this.id = id;
    this.amount = amount;
    this.desc = desc;
  };
  // data storage object
  var data = {
    all: {
      inc: [],
      exp: []
    },
    totals: {
      budget: 0,
      exp: 0,
      inc: 0
    }
  }

  var sum = function(arr){
    var s = 0;
    arr.forEach(function(current){
      s += current.amount;
    });
    return s;
  };

  return{
    setNewItem: function(type, amount, desc){
      var id;
      // create id: last element's id + 1
      if(data.all[type].length > 0){
        // get the last element's id and increment it
        id = data.all[type][data.all[type].length - 1].id + 1;
      }
      else{
        id = 0;
      }
      // create the item instance
      var item = new Item(id, amount, desc);
      // add it to the corresponding array
      data.all[type].push(item);
      // return the new item
      return item;
    },
    calculateTotals: function(){
      data.totals.inc = sum(data.all.inc);
      data.totals.exp = sum(data.all.exp);
      data.totals.budget = data.totals.inc - data.totals.exp;
    },
    getTotals: function(){
      return data.totals;
    },
    deleteItem: function(type, id){
      // loop through the inc or exp array and delete the item with this id
      data.all[type].forEach(function(current, index, array){
        if(current.id === parseInt(id)){
          array.splice(index, 1);
        }
      })
    },
    testData: function(){
      return data;
    }
  }
})();

// UI CONTROLLER
var UIController = (function(){

  var selectors = {
    totalBudget: 'total-budget',
    totalIncome: 'total-inc',
    totalExpenses: 'total-exp',
    addType: 'add-type',
    addAmount: 'add-amount',
    addDesc: 'add-desc',
    addNewItem: 'add-new',
    incItems: 'inc-items',
    expItems: 'exp-items'
  }

  return {
    makePageFullHeight: function(){
      if(window.innerWidth > 767){
        document.getElementById('data-container').style.height = window.innerHeight + 'px';
      }
    },
    getSelectors: function(){
      return selectors;
    },
    getInputData: function(){
      return{
        type: document.getElementById(selectors.addType).value, // inc or exp
        amount: parseFloat(document.getElementById(selectors.addAmount).value), //make integer, not string
        desc: document.getElementById(selectors.addDesc).value
      }
    },
    displayItem: function(type, item){
      var el, html, sign;
      // create an html string for the item element with @placeholders@ to be replaced with real data
      html = '<div id="@type@-@id@" class="item col-md-7"><div class="row"><div class="col-8 desc">@desc@</div><div class="col-4 amount text-right">@sign@ @amount@</div><i class="fa fa-times" aria-hidden="true"></i></div></div>';
      // determine what type it is and display in the right type
      if(type === 'inc'){
        el = document.getElementById(selectors.incItems);
        sign = '+';
      }
      else{
        el = document.getElementById(selectors.expItems);
        sign = '-';
      }
      // replace placeholders
      html = html.replace('@type@', type);
      html = html.replace('@id@', item.id);
      html = html.replace('@desc@', item.desc);
      html = html.replace('@sign@', sign);
      // round the amount to 2 decimal places
      html = html.replace('@amount@', parseFloat(Math.round(item.amount * 100) / 100).toFixed(2));
      // append the item to the DOM
      el.insertAdjacentHTML('beforeend', html);
      // add bootstrap class to the exp item to align to the right
      if(type === 'exp'){
        document.getElementById('exp-' + item.id).classList.add('ml-md-auto');
      }
    },
    clearFields: function(){
      document.getElementById(selectors.addAmount).value = '';
      document.getElementById(selectors.addDesc).value = '';
      // set focus on the amount feild again
      document.getElementById(selectors.addAmount).focus();
    },
    displayTotals: function(totals){
      var sign;
      totals.budget > 0 ? sign = '+ ' : sign = '- ';
      if(totals.budget === 0){sign = ''};
      // round the numbers to 2 decimal places
      document.getElementById(selectors.totalBudget).innerHTML = sign + Math.abs(parseFloat(Math.round(totals.budget * 100) / 100).toFixed(2));
      document.getElementById(selectors.totalIncome).innerHTML = '+ ' + parseFloat(Math.round(totals.inc * 100) / 100).toFixed(2);
      document.getElementById(selectors.totalExpenses).innerHTML = '- ' + parseFloat(Math.round(totals.exp * 100) / 100).toFixed(2);
    },
    changeInputBorderColor: function(){
      var type = document.getElementById(selectors.addType).value;
      var elements = document.getElementsByClassName('form-control');
      var icon = document.getElementById(selectors.addNewItem);
      if(type === 'inc'){
        // workaround the looping through the dom array return from getElementsByClassName
        Array.prototype.forEach.call(elements, function(current){
          current.classList.remove('exp-border-color');
          current.classList.add('inc-border-color');
        });
        // change the add button icon color
        icon.classList.remove('exp-color');
        icon.classList.add('inc-color');
      }
      else if(type === 'exp'){
        Array.prototype.forEach.call(elements, function(current){
          current.classList.remove('inc-border-color');
          current.classList.add('exp-border-color');
        });
        // change the add button icon color
        icon.classList.remove('inc-color');
        icon.classList.add('exp-color');
      }
    }
  }

})();

// MAIN APP CONTROLLER
var Controller = (function(AppCtrl, UICtrl) {
  // set event listeners on elements
  var setEventListeners = function(){
    // get the UI selectors
    var selectors = UICtrl.getSelectors();
    // add click event listener on the add new icon
    document.getElementById(selectors.addNewItem).addEventListener('click', handleNewItem);
    // also handle the user pressing the return key to add an item
    document.addEventListener('keypress', function(event) {
      if (event.keyCode === 13 || event.which === 13) {
          handleNewItem();
      }
    });
    // also make the border color of the input fields correspond to the type of the input: income color for + and expenses color for -
    document.getElementById(selectors.addType).addEventListener('change', function(){
      UICtrl.changeInputBorderColor();
    });
    // handle delete item by its id: catch click on the parent element
    document.getElementById('data-container').addEventListener('click', function(event){
      // delete the item from the data and the DOM
      // if the element clicked is the delete icon (class fa-times)
      if(event.srcElement.classList.contains('fa-times')){
        // find the item in the DOM and determine what kind of an item it is: 'inc' or 'exp'
        var itemElement = findAncestor(event.srcElement, 'item');
        if(itemElement !== null){
          var id = itemElement.id;
          id = id.split('-');
          // see if the id starts with 'inc' or 'exp' and call the AppController function delete passing the type and id of the item
          if(id[0] === 'inc'){
            AppCtrl.deleteItem('inc', id[1]);
          }
          else if(id[0] === 'exp'){
            AppCtrl.deleteItem('exp', id[1]);
          }
          // delete this item from the DOM
          itemElement.parentNode.removeChild(itemElement);
        }
      }
      // re-calculate the budget
      AppCtrl.calculateTotals();
      // display new budget totals
      var totals = AppCtrl.getTotals();
      UICtrl.displayTotals(totals);
    });
  }

  var findAncestor = function (el, cls) {
    // traverse DOM upwards from element el till we find an element with class cls and return this element
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
  }

  var handleNewItem = function(){
    // get the input data
    var input = UICtrl.getInputData();
    // validate the input data: desc not empty, amount is not empty, amount > 0
    if (input.desc !== "" && !isNaN(input.amount) && input.amount > 0) {
      // add the data to the logic controller
      var item = AppCtrl.setNewItem(input.type, input.amount, input.desc);
      // add item to the UI
      UICtrl.displayItem(input.type, item);
      // clear input fields
      UICtrl.clearFields();
      // calculate the totals
      AppCtrl.calculateTotals();
      // display totals
      var totals = AppCtrl.getTotals();
      UICtrl.displayTotals(totals);
    }
  }

  return {
      init: function() {
          console.log('Up and running...');
          UICtrl.makePageFullHeight();
          UICtrl.displayTotals({
            budget: 0,
            inc: 0,
            exp: 0
          });
          setEventListeners();
      }
  };

})(AppController, UIController);


Controller.init();
