import * as noticeboard from 'scalejs.noticeboard';
import dataservice from 'dataservice';
import { receive } from 'scalejs.messagebus';

    //TODO: Rename results to resultsKey

    /**
     * Store: a component that takes a dataSourceEndpoint
     * and adds the results to the noticeboard.
     * It has no viewmodel and does not accept children.
     *
     * @module store
     *
     * @param {object} node
     *  The configuation object for the module
     * @param {string} node.type='store'
     * The type of the node is store     *
     * @param {object} node.storeKey
     *  The key that the results are stored on in the noticeboard
     * @param {object|Object[]} node.dataSourceEndpoint
     *  An object defining the endpoint(s) that makes the ajax calls
     * @param {string} node.dataSourceEndpoint.uri
     *   The uri for the endpoint
     * @param {string} [node.dataSourceEndpoint.url]
     *  The url for the endpoint
     * @param {object} [node.dataSourceEndpoint.options]
     *  Options for the ajax call
     * @param {object} [node.keyMap]
     *  A mapper object to map keys
     * @param {object} [node.keyMap.result]
     *  Map the results from the ajax call with this key
     */
    export default function (node) {
        var keyMap = node.keyMap || {},
            storeKey = node.storeKey,
            dataSourceEndpoint = node.dataSourceEndpoint,
            options = node.options || {},
            subs = [];

        if (!storeKey) {
            console.warn('Cannot store data without a storeKey', node);
            return;
        }

        if (!dataSourceEndpoint) {
            console.warn('Cannot retrieve data for store without a dataSourceEndpoint', node);
            return;
        }

        //todo: check if storeKey is already in the noticeboard
        // option to persist data and not request endpoint multiple times
        function fetchData() {
            dataservice.ajax(dataSourceEndpoint, function (error, results) {
                if (error) {
                    console.error('Error when retrieving data for node', node, error);
                    return;
                }
                var value = keyMap.resultsKey ? results[keyMap.resultsKey] : results;

                if (options.mapArrayToDictionaryWithKey) {
                    value = value.reduce(function (obj, item) {
                        var key = options.mapArrayToDictionaryWithKey;
                        if (options.aggregateMappedItems) {
                            obj[item[key]] = obj[item[key]] || [];
                            obj[item[key]].push(item);
                        } else {
                            obj[item[key]] = keyMap.resultsValueKey ? item[keyMap.resultsValueKey] : item; // will overwrite any existing items with the key
                        }
                        return obj;
                    }, {})
                }
                noticeboard.setValue(storeKey, value);
            });
        }
        fetchData(); //initial call

        if (node.id) { //setup refresh receiver if store has id
            subs.push(receive(node.id + '.refresh', function () {
                fetchData();
            }));
        }

        return {
                dispose: function () {
                subs.forEach(function (sub) {
                    sub.dispose();
                });
            }
        }
    };