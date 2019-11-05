// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import test from 'tape';
import moment from 'moment';

import {
  testCreateCases,
  testFormatLayerDataCases,
  tripRows,
  tripDataId,
  preparedArcDataset
} from 'test/helpers/layer-utils';

import {KeplerGlLayers} from 'layers';

const {ArcLayer} = KeplerGlLayers;

test('#ArcLayer -> constructor', t => {
  const TEST_CASES = {
    CREATE: [
      {
        props: {
          dataId: 'smoothie',
          isVisible: true,
          label: 'test arc layer'
        },
        test: layer => {
          t.ok(
            layer.config.dataId === 'smoothie',
            'ArcLayer dataId should be correct'
          );
          t.ok(layer.type === 'arc', 'type should be arc');
          t.ok(layer.isAggregated === false, 'ArcLayer is not aggregated');
        }
      }
    ]
  };

  testCreateCases(t, ArcLayer, TEST_CASES.CREATE);
  t.end();
});

test('#ArcLayer -> formatLayerData', t => {
  const filteredIndex = [0, 2, 4];
  const firstRowWNull = [...preparedArcDataset.allData[0]];
  firstRowWNull[4] = null;
  const restRows = [...preparedArcDataset.allData];
  restRows.shift();

  const datasetWithNull = {
    ...preparedArcDataset,
    allData: [firstRowWNull, ...restRows],
    filteredIndex,
    filteredIndexForDomain: [0, 2, 4, 5, 6, 7, 8, 9, 10]
  };

  const TEST_CASES = [
    {
      name: 'Arc trip data.1',
      layer: {
        config: {
          dataId: tripDataId,
          label: 'trip arcs',
          columns: {
            lat0: 'pickup_latitude',
            lng0: 'pickup_longitude',
            lat1: 'dropoff_latitude',
            lng1: 'dropoff_longitude'
          },
          color: [10, 10, 10]
        },
        type: 'arc',
        id: 'test_layer_0'
      },
      datasets: {
        [tripDataId]: {
          ...preparedArcDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [
            {
              data: tripRows[0],
              index: 0,
              sourcePosition: [tripRows[0][4], tripRows[0][5], 0],
              targetPosition: [tripRows[0][6], tripRows[0][7], 0]
            },
            {
              data: tripRows[2],
              index: 2,
              sourcePosition: [tripRows[2][4], tripRows[2][5], 0],
              targetPosition: [tripRows[2][6], tripRows[2][7], 0]
            },
            {
              data: tripRows[4],
              index: 4,
              sourcePosition: [tripRows[4][4], tripRows[4][5], 0],
              targetPosition: [tripRows[4][6], tripRows[4][7], 0]
            }
          ],
          getFilterValue: () => {},
          getSourceColor: () => {},
          getTargetColor: () => {},
          getWidth: () => {}
        };
        const expectedDataKeys = Object.keys(expectedLayerData).sort();

        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 6 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct arc layerData data'
        );
        // getSourceColor
        t.deepEqual(
          layerData.getSourceColor,
          layer.config.color,
          'getSourceColor should be a constant'
        );
        // getSourceColor
        t.deepEqual(
          layerData.getTargetColor,
          layer.config.color,
          'getTargetColors should be a constant'
        );
        // getWidth
        t.equal(layerData.getWidth, 1, 'getWidth should be a constant');
        // getFilterValue
        t.deepEqual(
          layerData.getFilterValue(layerData.data[0]),
          [moment.utc(tripRows[0][1]).valueOf(), 0, 0, 0],
          'getFilterValue should return [value, 0, 0, 0]'
        );

        // layerMeta
        t.deepEqual(
          layer.meta,
          {
            bounds: [-73.99389648, 40.71858978, -73.86306, 40.7868576]
          },
          'should format correct arc layer meta'
        );
      }
    },
    {
      name: 'Arc trip data.1 with Null position',
      layer: {
        config: {
          dataId: tripDataId,
          label: 'trip arcs',
          columns: {
            lat0: 'pickup_latitude',
            lng0: 'pickup_longitude',
            lat1: 'dropoff_latitude',
            lng1: 'dropoff_longitude'
          },
          color: [10, 10, 10]
        },
        type: 'arc',
        id: 'test_layer_1'
      },
      datasets: {
        [tripDataId]: datasetWithNull
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [
            {
              data: tripRows[2],
              index: 2,
              sourcePosition: [tripRows[2][4], tripRows[2][5], 0],
              targetPosition: [tripRows[2][6], tripRows[2][7], 0]
            },
            {
              data: tripRows[4],
              index: 4,
              sourcePosition: [tripRows[4][4], tripRows[4][5], 0],
              targetPosition: [tripRows[4][6], tripRows[4][7], 0]
            }
          ],
          getFilterValue: () => {},
          getSourceColor: () => {},
          getTargetColor: () => {},
          getWidth: () => {}
        };
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct arc layerData data'
        );
        // getFilterValue
        t.deepEqual(
          layerData.getFilterValue(layerData.data[0]),
          [moment.utc(tripRows[2][1]).valueOf(), 0, 0, 0],
          'getFilterValue should return [value, 0, 0, 0]'
        );

        // layerMeta
        t.deepEqual(
          layer.meta,
          {
            bounds: [-73.98397827, 40.71858978, -73.86306, 40.7868576]
          },
          'should format correct arc layer meta'
        );
      }
    },
    {
      name: 'Arc trip data.2 targetColor',
      layer: {
        config: {
          dataId: tripDataId,
          label: 'trip arcs',
          columns: {
            lat0: 'pickup_latitude',
            lng0: 'pickup_longitude',
            lat1: 'dropoff_latitude',
            lng1: 'dropoff_longitude'
          },
          color: [10, 10, 10],
          visConfig: {
            targetColor: [1, 2, 3]
          }
        },
        type: 'arc',
        id: 'test_layer_2'
      },
      datasets: {
        [tripDataId]: preparedArcDataset
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: tripRows.map((row, index) => ({
            data: row,
            index,
            sourcePosition: [row[4], row[5], 0],
            targetPosition: [row[6], row[7], 0]
          })),
          getFilterValue: () => {},
          getSourceColor: () => {},
          getTargetColor: () => {},
          getWidth: () => {}
        };
        const expectedDataKeys = Object.keys(expectedLayerData).sort();

        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 6 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct arc layerData data'
        );
        // getSourceColor
        t.deepEqual(
          layerData.getSourceColor,
          layer.config.color,
          'getSourceColor should be a constant'
        );
        // getSourceColor
        t.deepEqual(
          layerData.getTargetColor,
          [1, 2, 3],
          'getTargetColors should be a constant'
        );
      }
    },
    {
      name: 'Arc trip data. with colorField and sizeField',
      layer: {
        config: {
          dataId: tripDataId,
          label: 'trip arcs',
          columns: {
            lat0: 'pickup_latitude',
            lng0: 'pickup_longitude',
            lat1: 'dropoff_latitude',
            lng1: 'dropoff_longitude'
          },
          color: [10, 10, 10],
          // color by id contain null
          colorField: {
            name: 'fare_type',
            type: 'string'
          },
          // size by id contain null
          sizeField: {
            name: 'fare_amount',
            type: 'real'
          }
        },
        type: 'arc',
        id: 'test_layer_1'
      },
      datasets: {
        [tripDataId]: {
          ...preparedArcDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [
            {
              data: tripRows[0],
              index: 0,
              sourcePosition: [tripRows[0][4], tripRows[0][5], 0],
              targetPosition: [tripRows[0][6], tripRows[0][7], 0]
            },
            {
              data: tripRows[2],
              index: 2,
              sourcePosition: [tripRows[2][4], tripRows[2][5], 0],
              targetPosition: [tripRows[2][6], tripRows[2][7], 0]
            },
            {
              data: tripRows[4],
              index: 4,
              sourcePosition: [tripRows[4][4], tripRows[4][5], 0],
              targetPosition: [tripRows[4][6], tripRows[4][7], 0]
            }
          ],
          getFilterValue: () => {},
          getSourceColor: () => {},
          getTargetColor: () => {},
          getWidth: () => {}
        };
        const expectedDataKeys = Object.keys(expectedLayerData).sort();

        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 6 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct arc layerData data'
        );
        // getSourceColor
        t.deepEqual(
          layerData.getSourceColor(layerData.data[0]),
          [199, 0, 57],
          'getSourceColor be correct'
        );
        // getSourceColor
        // domain: ['apple tree', 'banana peel', 'orange peel'  ]
        // range [ '#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300' ]
        t.deepEqual(
          layerData.getTargetColor(layerData.data[0]),
          // #C70039
          [199, 0, 57],
          'getTargetColors  be correct'
        );
        // getWidth
        // domain: [11.5, 26]
        // ran ge: [0, 10]
        t.equal(layerData.getWidth(layerData.data[0]), 0.3448275862068966, 'getWidth should be a constant');
        // getFilterValue
        t.deepEqual(
          layerData.getFilterValue(layerData.data[0]),
          [moment.utc(tripRows[0][1]).valueOf(), 0, 0, 0],
          'getFilterValue should return [value, 0, 0, 0]'
        );

        // layerMeta
        t.deepEqual(
          layer.meta,
          {
            bounds: [-73.99389648, 40.71858978, -73.86306, 40.7868576]
          },
          'should format correct arc layer meta'
        );
      }
    }
  ];

  testFormatLayerDataCases(t, ArcLayer, TEST_CASES);
  t.end();
});
