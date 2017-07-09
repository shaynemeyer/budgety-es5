var budgetController = (function () {

  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function (totalIncome) {

    if (totalIncome > 0) {
      this.percentage = Math.round(this.value / totalIncome * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function () {
    return this.percentage;
  };

  var Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function (type) {
    var sum = 0;
    data.allItems[type].forEach(function (cur) {
      sum += cur.value;
    });
    data.totals[type] = sum;
  };

  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1
  };

  return {
    addItem: function (type, desc, val) {
      var newItem, ID;

      // Create new ID
      ID = data.allItems[type].length > 0 ? data.allItems[type][data.allItems[type].length - 1].id + 1 : 0;

      // Create new item based on 'inc' or 'exp' type
      if(type==='exp'){
        newItem = new Expense(ID,desc,val);
      } else if (type === 'inc') {
        newItem = new Income(ID, desc, val);
      }

      // Push it into our data structure
      data.allItems[type].push(newItem);

      // Return the new element
      return newItem;
    },

    deleteItem: function (type, id) {
      var ids, index;

      // id = 3

      ids = data.allItems[type].map(function (item) {
        return item.id;
      });

      index = ids.indexOf(id);

      if (index !== -1) {
        data.allItems[type].splice(index, 1);
      }

    },

    calculateBudget: function () {

      // Calculate total income and expenses
      calculateTotal('exp');
      calculateTotal('inc');

      // Calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      // Calculate the percentage of income that we spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }

    },

    calculatePercentages: function () {
      data.allItems.exp.forEach(function (expense) {
        expense.calcPercentage(data.totals.inc);
      });
    },

    getPercentages: function () {
      var allPerc = data.allItems.exp.map(function (expense) {
        return expense.getPercentage();
      });

      return allPerc;
    },

    getBudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage
      }
    },

    testing: function () {
      console.log(data);
    }
  }
})();


var UIController = (function () {

  var DOMstrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputButton: '.add__btn',
    incomeContainer: '.income__list',
    expenseContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercentageLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  };

  var formatNumber = function(num, type){
    var numSplit, int, dec;
    /*
     + or - before number
     exactly 2 decimal points
     comma separating the thousands
     2310.4567 -> + 2,310.46
     2000 -> + 2,000.00
     */

    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split('.');

    int = numSplit[0];
    if(int.length > 3) {
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
    }

    dec = numSplit[1];

    return (type === 'exp' ? '-' : '+') + ' ' + int + '.' +  dec;

  };

  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getInput: function () {
      return {
        type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp
        description: document.querySelector(DOMstrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
      }
    },

    addListItem: function (obj, type) {
      var html, newHtml, element;

      // Create HTML string with placeholder text
      if (type === 'inc') {
        element = DOMstrings.incomeContainer;
        html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === 'exp') {
        element = DOMstrings.expenseContainer;
        html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div> <div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div> <div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // Replace the placeholder text with some actual data
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

    },

    deleteListItem: function (selectorId) {
      var el = document.getElementById(selectorId);
      el.parentNode.removeChild(el);
    },

    clearFields: function () {
      var fields, fieldsArr;
      fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

      fieldsArr = Array.prototype.slice.call(fields);

      fieldsArr.forEach(function (current, index, array) {
        current.value = "";
      });

      fieldsArr[0].focus();
    },

    displayBudget: function (obj) {

      var type = (obj.budget > 0) ? 'inc': 'exp';

      document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
      document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');


      if (obj.percentage > 0) {
        document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage;
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = '---';
      }
    },

    displayPercentages: function (percentages) {

      var fields = document.querySelectorAll(DOMstrings.expensesPercentageLabel);

      nodeListForEach(fields, function (current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + '%';
        } else {
          current.textContent = '---';
        }

      });
    },

    displayMonth: function () {
      var now, month, year, months;
      now = new Date();
      month = now.getMonth();
      year = now.getFullYear();
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
    },

    changeType: function () {
      var fields = document.querySelectorAll(
        DOMstrings.inputType + ',' +
        DOMstrings.inputDescription + ',' +
        DOMstrings.inputValue
      );

      nodeListForEach(fields, function(cur) {
        cur.classList.toggle('red-focus');
      });

      document.querySelector(DOMstrings.inputButton).classList.toggle('red');
    },

    getDOMStrings: function () {
      return DOMstrings;
    }
  }
})();


var controller = (function (budgetCtrl, UICtrl) {

  var setupEventListeners = function () {

    var DOM = UICtrl.getDOMStrings();

    document.querySelector(DOM.inputButton).addEventListener('click', ctrlAddItem);

    document.addEventListener('keypress', function (e) {

      if (e.keyCode === 13) {
        ctrlAddItem();
      }
    });

    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
  };

  var updateBudget = function () {
    // Calculate the budget
    budgetCtrl.calculateBudget();

    // Return the budget
    var budget = budgetCtrl.getBudget();

    // Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function () {

    // Calculate percentages
    budgetCtrl.calculatePercentages();

    // Read percentages from the budget controller
    var percentages = budgetCtrl.getPercentages();

    // Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);

  };

  var ctrlAddItem = function () {
    var input, newItem;

    // Get the field input data
    input = UIController.getInput();

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // Add the item to the UI
      UICtrl.addListItem(newItem, input.type);

      // Clear the fields
      UICtrl.clearFields();

      // Calculate and update budget
      updateBudget();

      // Calculate and update percentages
      updatePercentages();
    }

  };

  var ctrlDeleteItem = function (event) {
    var itemId, splitId, type, id;

    itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;

    if (itemId) {
      // inc-1
      splitId = itemId.split('-');
      type = splitId[0] === 'income'? 'inc': 'exp';
      id = parseInt(splitId[1]);

      // Delete item from data structure
      budgetCtrl.deleteItem(type, id);

      // Delete the item from the UI
      UICtrl.deleteListItem(itemId);

      // Update and show the new budget
      updateBudget();

      // Calculate and update percentages
      updatePercentages();

    }
  };

  return {
    init: function () {
      console.log('Application has started.');
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: 0
      });
      setupEventListeners();
      UICtrl.displayMonth();
    }
  };

})(budgetController, UIController);

controller.init();