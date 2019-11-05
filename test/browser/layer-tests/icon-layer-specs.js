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
  testRenderLayerCases,
  preparedIconDataset,
  iconDataId,
  iconRows
} from 'test/helpers/layer-utils';
import {iconGeometry} from 'test/fixtures/test-icon-data';
import {KeplerGlLayers} from 'layers';

const {IconLayer} = KeplerGlLayers;

test('#IconLayer -> constructor', t => {
  const TEST_CASES = {
    CREATE: [
      {
        props: {
          dataId: 'smoothie',
          isVisible: true,
          label: 'test icon layer'
        },
        test: layer => {
          t.ok(
            layer.config.dataId === 'smoothie',
            'IconLayer dataId should be correct'
          );
          t.ok(layer.type === 'icon', 'type should be icon');
          t.ok(layer.isAggregated === false, 'IconLayer is not aggregated');
        }
      }
    ]
  };

  testCreateCases(t, IconLayer, TEST_CASES.CREATE);
  t.end();
});

test('#IconLayer -> formatLayerData', t => {
  const filteredIndex = [0, 2, 4, 5];

  const TEST_CASES = [
    {
      name: 'gps point with icon.1',
      layer: {
        config: {
          dataId: iconDataId,
          label: 'gps point icon',
          columns: {
            lat: 'event_lat',
            lng: 'event_lng',
            icon: 'icon'
          },
          color: [2, 3, 4]
        },
        type: 'icon',
        id: 'test_layer_1'
      },
      datasets: {
        [iconDataId]: {
          ...preparedIconDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [
            {
              data: iconRows[0],
              index: 0,
              icon: 'accel'
            },
            {
              data: iconRows[5],
              index: 5,
              icon: 'attach'
            }
          ],
          getFilterValue: () => {},
          getFillColor: () => {},
          getRadius: () => {},
          getPosition: () => {}
        };

        t.deepEqual(
          Object.keys(layerData).sort(),
          Object.keys(expectedLayerData).sort(),
          'layerData should have 5 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct point layerData data'
        );
        // getPosition
        t.deepEqual(
          layerData.getPosition(layerData.data[0]),
          [iconRows[0][2], iconRows[0][1]],
          'getPosition should return correct position'
        );
        // getFillColor
        t.deepEqual(
          layerData.getFillColor,
          [2, 3, 4],
          'getFillColor should be a constant'
        );
        // getRadius
        t.equal(layerData.getRadius, 1, 'getRadius should be a constant');
        // getFilterValue
        t.deepEqual(
          layerData.getFilterValue(layerData.data[0]),
          [moment.utc(iconRows[0][0]).valueOf(), 0, 0, 0],
          'getFilterValue should return [0, 0, 0, 0]'
        );
        // layerMeta
        t.deepEqual(
          layer.meta,
          {
            bounds: [-122.41889, 37.37006, -121.96353, 38.281445]
          },
          'should format correct point layer meta'
        );
      }
    }
  ];

  testFormatLayerDataCases(t, IconLayer, TEST_CASES);
  t.end();
});

test('#IconLayer -> renderLayer', t => {
  const filteredIndex = [0, 2, 4, 5];

  const TEST_CASES = [
    {
      name: 'Test render icon.1 -> no icon Geometry',
      layer: {
        id: 'test_layer_1',
        type: 'icon',
        config: {
          dataId: iconDataId,
          label: 'gps point icon',
          columns: {
            lat: 'event_lat',
            lng: 'event_lng',
            icon: 'icon'
          }
        }
      },
      datasets: {
        [iconDataId]: {
          ...preparedIconDataset,
          filteredIndex
        }
      },
      assert: (deckLayers, layer) => {
        t.equal(layer.type, 'icon', 'should create 1 icon layer');
        t.equal(
          deckLayers.length,
          0,
          'Should create 0 deck.gl layer when icon geometry is not provided'
        );
      }
    },

    {
      name: 'Test render icon.2 -> has icon geometry',
      layer: {
        id: 'test_layer_1',
        type: 'icon',
        config: {
          dataId: iconDataId,
          label: 'gps point icon',
          columns: {
            lat: 'event_lat',
            lng: 'event_lng',
            icon: 'icon'
          },
          color: [1, 2, 3]
        }
      },
      afterLayerInitialized: layer => {
        layer.iconGeometry = iconGeometry;
      },
      datasets: {
        [iconDataId]: {
          ...preparedIconDataset,
          filteredIndex
        }
      },
      assert: (deckLayers, layer) => {
        t.equal(layer.type, 'icon', 'should create 1 icon layer');
        t.equal(
          deckLayers.length,
          3,
          'Should create 3 deck.gl layer when icon geometry is provided'
        );
        const expectedLayerIds = [
          'test_layer_1',
          'test_layer_1-accel',
          'test_layer_1-attach'
        ];
        t.deepEqual(
          deckLayers.map(l => l.id),
          expectedLayerIds,
          'should create 1 composite, 2 svg icon layer'
        );
        const dataCount = 1;
        // test test_layer_1-accel
        const {attributes} = deckLayers[1].state.attributeManager;

        // test instancePositions
        t.deepEqual(
          attributes.instancePositions.value.slice(0, dataCount * 3),
          new Float32Array([-122.40894, 37.778564, 0]),
          'Should calculate correct instancePosition'
        );

        // test instanceFillColors
        t.deepEqual(
          attributes.instanceFillColors.value,
          new Float32Array([1 / 255, 2 / 255, 3 / 255, 1]),
          'Should calculate correct instanceFillColor'
        );
        // test filterValues
        t.deepEqual(
          attributes.filterValues.value.slice(0, dataCount * 4),
          new Float32Array([moment.utc(iconRows[0][0]).valueOf(), 0, 0, 0]),
          'Should calculate correct filterValues'
        );
        // test instanceRadius
        t.deepEqual(
          attributes.instanceRadius.value,
          [1],
          'Should calculate correct instanceRadius'
        );
      }
    }
  ];

  testRenderLayerCases(t, IconLayer, TEST_CASES);
  t.end();
});
