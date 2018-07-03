(function () {
    'use strict';

    var app = {
        apiURL: 'https://free.currencyconverterapi.com/api/v5/currencies',
        convertApi: 'https://free.currencyconverterapi.com/api/v5/convert?q='
    };

    
    
    /***********************
     Main application code
     **********************/
    $(document).ready(() => {
        $('select').material_select();

        $('#txtAmount').val(1);
        $('#convertedValue').text('');

        if ('caches' in window) {
            isCurrencyAlreadyInCache(app.apiURL);
        }

        fetchCurrencyFromNetwork(app.apiURL);
    });

    $('.btnConvert').click(() => {
        getConvertedCurrency();
    });

    var isCurrencyAlreadyInCache = (url) => {
        caches.match(url).then(function (response) {
            if (response) {
                response.json().then(function updateFromCache(json) {
                    var values = json.results;

                    var dataArray = [];

                    Object.keys(values).sort().forEach((key) => {
                        var obj = {};

                        let id = key;
                        let name = values[key]['currencyName'];
                        var sym = values[key]['currencySymbol'];
                        var symbol = sym == null ? id : sym;

                        var res = `${id} | ${name} (${symbol})`;

                        obj['id'] = id;
                        obj['currency'] = res;

                        dataArray.push(obj);
                    });

                    updateSelectControl(dataArray);
                });
            }
        });
    }


    var fetchCurrencyFromNetwork = (url) => {
        fetch(url)
            .then(response => response.json())
            .then((data) => {
                var values = data.results;

                var dataArray = [];

                Object.keys(values).sort().forEach((key) => {
                    var obj = {};

                    let id = key;
                    let name = values[key]['currencyName'];
                    var sym = values[key]['currencySymbol'];
                    var symbol = sym == null ? id : sym;

                    var res = `${id} | ${name} (${symbol})`;

                    obj['id'] = id;
                    obj['currency'] = res;

                    dataArray.push(obj);
                });

                updateSelectControl(dataArray);

                saveCurrencyToDatabase(values);
            })
            .catch(error => console.log(error));
    }

    //update select control with currency
    var updateSelectControl = (data) => {
        for (var res of data) {
            $('#curr_from').append($('<option></option>').val(res.id).html(res.currency));
            $('#curr_to').append($('<option></option>').val(res.id).html(res.currency));
        }

        $('#curr_from').prop('selectedIndex', 141);
        $('#curr_to').prop('selectedIndex', 99);

        $('select').material_select();

        $('.btnConvert').removeClass('disabled');
    }

    var getConvertedCurrency = () => {
        let currAmount = $('#txtAmount').val();
        let fromCurr = $('#curr_from').val();
        let toCurr = $('#curr_to').val();

        let currId = fromCurr + '_' + toCurr;

        let api = app.convertApi + currId + '&compact=ultra';

        let floatConvert = parseFloat(currAmount);

        if (navigator.onLine) {
            fetch(api)
                .then(response => response.json())
                .then(data => {
                    let convertedValue = (floatConvert * data[currId]);
                    let finalValue = `${currAmount} ${fromCurr} to ${toCurr} = ${convertedValue}`;
                    $('#convertedValue').text(finalValue);
                })
                .catch(error => console.log(error));
        } else {
            $('#convertedValue').text('');
            alert('Sorry! You need internet for conversion.');
        }
    }



    /***********************
     Indexed DB Support
     **********************/
    //saved currency to database
    var saveCurrencyToDatabase = (values) => {
        if (!('indexedDB' in window)) {
            alert("Your browser doesn't support a stable version of IndexedDB.");
        }

        var dataArray = [];

        Object.keys(values).sort().forEach((key) => {
            var obj = {};

            let id = key;
            let name = values[key]['currencyName'];
            var sym = values[key]['currencySymbol'];
            var symbol = sym == null ? id : sym;

            obj['id'] = id;
            obj['currencyName'] = name;
            obj['currencySymbol'] = symbol;

            dataArray.push(obj);
        });

        var request = indexedDB.open('currencyConverterDB', 1);
        request.onerror = function () {
            alert('IndexedDB Not Allowed!')
        };
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            var objectStore = db.createObjectStore("currency", {
                keyPath: "id"
            });

            objectStore.transaction.oncomplete = function(event) {
                var tx = db.transaction('currency', 'readwrite');
                var currencyStore = tx.objectStore('currency');
                for (var data of dataArray) {
                    currencyStore.add(data);
                }
                console.log('Currency Added Successfully');
            }
        };
    }




    /***********************
     Service worker support
     **********************/
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function () {
                console.log('Service Worker Registered');
            });
    }
})();