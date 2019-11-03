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

export default `time,event_lat,event_lng,icon,icon-bk,severity
2016-06-28 20:02:06,37.778564,-122.40894,accel,3
2016-06-28 20:09:18,37.78824,-122.40894,add-person,3
2016-06-28 20:03:16,38.281445,,alert,6
2016-06-28 20:05:55,37.79354,-122.40121,android,5
2016-06-28 20:03:39,37.456535,-122.136795,,4
2016-06-28 20:05:51,37.40066,-122.10239,attach,3
2016-06-28 20:00:18,37.769897,-122.41168,,2
2016-06-28 20:02:13,37.798237,-122.41889,,5
2016-06-28 20:06:23,37.76018,-122.41097,,5
2016-06-28 20:05:16,37.37006,-121.96353,car-suv,4
2016-06-28 20:06:28,37.418655,-122.149734,car-taxi,3`;

export const iconDataId = 'test_icon_data';

export const iconGeometry = {
  accel: [1, 2, 3, 4],
  'add-person': [1, 2, 3, 4],
  alert: [1, 2, 3, 4],
  android: [1, 2, 3, 4],
  attach: [1, 2, 3, 4],
  'car-suv': [1, 2, 3, 4],
  'car-taxi': [1, 2, 3, 4]
}
