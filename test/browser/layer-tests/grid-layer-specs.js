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
import {
  testCreateCases,
  testFormatLayerDataCases,
  preparedDataset,
  preparedDatasetWithNull,
  dataId,
  rows,
  rowsWithNull,
  fieldsWithNull
} from 'test/helpers/layer-utils';

import GridLayer from 'layers/grid-layer/grid-layer';

test('#GridLayer -> constructor', t => {
  const TEST_CASES = {
    CREATE: [
      {
        props: {
          dataId: 'smoothie',
          isVisible: true,
          label: 'test grid layer'
        },
        test: layer => {
          t.ok(
            layer.config.dataId === 'smoothie',
            'gridLayer dataId should be correct'
          );
          t.ok(layer.type === 'grid', 'type should be grid');
          t.ok(layer.isAggregated === true, 'gridLayer is aggregated');
        }
      }
    ]
  };

  testCreateCases(t, GridLayer, TEST_CASES.CREATE);
  t.end();
});

test('#GridLayer -> formatLayerData', t => {
  const filteredIndex = [0, 2, 4];

  const expectedLayerMeta = {
    bounds: [31.2148748, 29.9870074, 31.2590542, 30.0614122]
  };
  const expectedLayerMetaNull = {
    bounds: [31.2149361, 29.9870074, 31.2590542, 30.0292134]
  };

  const TEST_CASES = [
    {
      name: 'Grid gps point.1',
      layer: {
        type: 'grid',
        id: 'test_layer_1',
        config: {
          dataId,
          label: 'some geometry file',
          columns: {
            lat: 'gps_data.lat',
            lng: 'gps_data.lng'
          },
          color: [1, 2, 3]
        }
      },
      datasets: {
        [dataId]: {
          ...preparedDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;
        const expectedLayerData = {
          data: [{
            data: rows[0],
            index: 0
          }, {
            data: rows[2],
            index: 2
          }, {
            data: rows[4],
            index: 4
          }]
        };
        const expectedDataKeys = [
          'data',
          'getColorValue',
          'getElevationValue',
          'getPosition'
        ];
        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 4 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct grid layerData'
        );
        // test getPosition
        t.deepEqual(
          layerData.getPosition(layerData.data[0]),
          [rows[0][2], rows[0][1]],
          'getPosition should return correct position'
        );
        // test getColorValue  [1474071095000, 1474071608000]
        // 0: 2016-09-17 00:09:55 1474070995000
        // 2: 2016-09-17 00:11:56 1474071116000
        // 4: 2016-09-17 00:14:00 1474071240000
        t.equal(
          // assume all points fall into one bin
          layerData.getColorValue(expectedLayerData.data),
          2,
          'should return filtered point count'
        );
        t.equal(
          // assume all points fall into one bin
          layerData.getElevationValue(expectedLayerData.data),
          2,
          'should return filtered point count'
        );
        // test getElevationValue
        t.deepEqual(
          layer.meta,
          expectedLayerMeta,
          'should format correct grid layer meta'
        );
      }
    },
    {
      name: 'Test Grid gps point.2 Data With Nulls',
      layer: {
        type: 'grid',
        id: 'test_layer_1',
        config: {
          dataId,
          label: 'some geometry file',
          columns: {
            lat: 'gps_data.lat',
            lng: 'gps_data.lng'
          },
          // color by id(int)
          colorField: fieldsWithNull[6],
          // size by id(int)
          sizeField: fieldsWithNull[6]
        }
      },
      datasets: {
        [dataId]: {
          ...preparedDatasetWithNull,
          filteredIndex: [0, 2, 4, 7],
          filteredIndexForDomain: [0, 2, 4, 5, 6, 7, 8, 9, 10]
        }
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [{
            data: rowsWithNull[0],
            index: 0
          }, {
            data: rowsWithNull[4],
            index: 4
          }, {
            data: rowsWithNull[7],
            index: 7
          }]
        };

        t.deepEqual(
          Object.keys(layerData).sort(),
          ['data', 'getColorValue', 'getElevationValue', 'getPosition'],
          'layerData should have 3 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should filter out nulls, format correct grid layerData'
        );
        t.deepEqual(
          layerData.getPosition(layerData.data[0]),
          [rowsWithNull[0][2], rowsWithNull[0][1]],
          'getPosition should return correct position'
        );
        // test getColorValue with filter [1474071095000, 1474071608000]
        // 0: Null
        // 4: 2016-09-17 00:14:00 1474071240000 id: 5
        // 7: 2016-09-17 00:17:05 1474071425000 id: 345
        t.equal(
          // assume all points fall into one bin
          layerData.getColorValue(expectedLayerData.data),
          // avg id
          (5 + 345) / 2,
          'should calculate correct bin color'
        );

        t.equal(
          // assume all points fall into one bin
          layerData.getElevationValue(expectedLayerData.data),
          // avg id
          (5 + 345) / 2,
          'should calculate correct bin elevation'
        );

        t.deepEqual(
          layer.meta,
          expectedLayerMetaNull,
          'should format correct grid layer meta'
        );
      }
    }
  ];

  testFormatLayerDataCases(t, GridLayer, TEST_CASES);
  t.end();
});
