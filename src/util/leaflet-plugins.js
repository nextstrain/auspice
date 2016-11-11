const plugins = () => {

  // This file is part of Leaflet.Geodesic.
  // Copyright (C) 2014  Henry Thasler
  // based on code by Chris Veness Copyright (C) 2014 https://github.com/chrisveness/geodesy
  //
  // Leaflet.Geodesic is free software: you can redistribute it and/or modify
  // it under the terms of the GNU General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // Leaflet.Geodesic is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU General Public License for more details.
  //
  // You should have received a copy of the GNU General Public License
  // along with Leaflet.Geodesic.  If not, see <http://www.gnu.org/licenses/>.


  // https://github.com/henrythasler/Leaflet.Geodesic/blob/master/Leaflet.Geodesic.js

/** Extend Number object with method to convert numeric degrees to radians */
if (typeof Number.prototype.toRadians == 'undefined') {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; }
}

/** Extend Number object with method to convert radians to numeric (signed) degrees */
if (typeof Number.prototype.toDegrees == 'undefined') {
    Number.prototype.toDegrees = function() { return this * 180 / Math.PI; }
}

var INTERSECT_LNG = 179.999;	// Lng used for intersection and wrap around on map edges

L.Geodesic = L.Polyline.extend({
      options: {
        color: 'blue',
        steps: 10,
        dash: 1,
        wrap: true
      },

      initialize: function(latlngs, options) {
        this.options = this._merge_options(this.options, options);
        this.datum = {};
        this.datum.ellipsoid = {
          a: 6378137,
          b: 6356752.3142,
          f: 1 / 298.257223563
        }; // WGS-84
        this._latlngs = (this.options.dash < 1) ? this._generate_GeodesicDashed(latlngs) : this._generate_Geodesic(latlngs);
        L.Polyline.prototype.initialize.call(this, this._latlngs, this.options);
      },

      setLatLngs: function(latlngs) {
        this._latlngs = (this.options.dash < 1) ? this._generate_GeodesicDashed(latlngs) : this._generate_Geodesic(latlngs);
        L.Polyline.prototype.setLatLngs.call(this, this._latlngs);
      },

    /**
    * Calculates some statistic values of current geodesic multipolyline
    * @returns (Object} Object with several properties (e.g. overall distance)
    */
    getStats: function() {
      var obj = {
          distance: 0,
          points: 0,
          polygons: this._latlngs.length
        },
        poly, points;

      for (poly = 0; poly < this._latlngs.length; poly++) {
        obj.points += this._latlngs[poly].length;
        for (points = 0; points < (this._latlngs[poly].length - 1); points++) {
          obj.distance += this._vincenty_inverse(this._latlngs[poly][points], this._latlngs[poly][points + 1]).distance;
        }
      }
      return obj;
    },

    /**
    * Creates a great circle. Replaces all current lines.
    * @param {Object} center - geographic position
    * @param {number} radius - radius of the circle in meters
    */
    createCircle: function(center, radius) {
      var _geo = [],
        _geocnt = 0;
      var prev = {
        lat: 0,
        lng: 0,
        brg: 0
      }; //new L.LatLng(0, 0);
      var s;

      _geo[_geocnt] = [];

      var direct = this._vincenty_direct(L.latLng(center), 0, radius, this.options.wrap);
      prev = L.latLng(direct.lat, direct.lng);
      _geo[_geocnt].push(prev);
      for (s = 1; s <= this.options.steps;) {
        direct = this._vincenty_direct(L.latLng(center), 360 / this.options.steps * s, radius, this.options.wrap);
        var gp = L.latLng(direct.lat, direct.lng);
        if (Math.abs(gp.lng - prev.lng) > 180) {
          var inverse = this._vincenty_inverse(prev, gp);
          var sec = this._intersection(prev, inverse.initialBearing, {
            lat: -89,
            lng: ((gp.lng - prev.lng) > 0) ? -INTERSECT_LNG : INTERSECT_LNG
          }, 0);
          if (sec) {
            _geo[_geocnt].push(L.latLng(sec.lat, sec.lng));
            _geocnt++;
            _geo[_geocnt] = [];
            prev = L.latLng(sec.lat, -sec.lng);
            _geo[_geocnt].push(prev);
          } else {
            _geocnt++;
            _geo[_geocnt] = [];
            _geo[_geocnt].push(gp);
            prev = gp;
            s++;
          }
        } else {
          _geo[_geocnt].push(gp);
          prev = gp;
          s++;
        }
      }

      this._latlngs = _geo;
      L.Polyline.prototype.setLatLngs.call(this, this._latlngs);
    },

    /**
    * Creates a geodesic Polyline from given coordinates
    * @param {Object} latlngs - One or more polylines as an array. See Leaflet doc about Polyline
    * @returns (Object} An array of arrays of geographical points.
    */
    _generate_Geodesic: function(latlngs) {
      var _geo = [],
        _geocnt = 0,
        s, poly, points;
      //      _geo = latlngs;		// bypass

      for (poly = 0; poly < latlngs.length; poly++) {
        _geo[_geocnt] = [];
        for (points = 0; points < (latlngs[poly].length - 1); points++) {
          var inverse = this._vincenty_inverse(L.latLng(latlngs[poly][points]), L.latLng(latlngs[poly][points + 1]));
          var prev = L.latLng(latlngs[poly][points]);
          _geo[_geocnt].push(prev);
          for (s = 1; s <= this.options.steps;) {
            var direct = this._vincenty_direct(L.latLng(latlngs[poly][points]), inverse.initialBearing, inverse.distance / this.options.steps * s, this.options.wrap);
            var gp = L.latLng(direct.lat, direct.lng);
            if (Math.abs(gp.lng - prev.lng) > 180) {
              var sec = this._intersection(L.latLng(latlngs[poly][points]), inverse.initialBearing, {
                lat: -89,
                lng: ((gp.lng - prev.lng) > 0) ? -INTERSECT_LNG : INTERSECT_LNG
              }, 0);
              if (sec) {
                _geo[_geocnt].push(L.latLng(sec.lat, sec.lng));
                _geocnt++;
                _geo[_geocnt] = [];
                prev = L.latLng(sec.lat, -sec.lng);
                _geo[_geocnt].push(prev);
              } else {
                _geocnt++;
                _geo[_geocnt] = [];
                _geo[_geocnt].push(gp);
                prev = gp;
                s++;
              }
            } else {
              _geo[_geocnt].push(gp);
              prev = gp;
              s++;
            }
          }
        }
        _geocnt++;
      }
      return _geo;
    },


    /**
    * Creates a dashed geodesic Polyline from given coordinates - under work
    * @param {Object} latlngs - One or more polylines as an array. See Leaflet doc about Polyline
    * @returns (Object} An array of arrays of geographical points.
    */
    _generate_GeodesicDashed: function(latlngs) {
      var _geo = [],
        _geocnt = 0,
        s, poly, points;
      //      _geo = latlngs;		// bypass

      for (poly = 0; poly < latlngs.length; poly++) {
        _geo[_geocnt] = [];
        for (points = 0; points < (latlngs[poly].length - 1); points++) {
          var inverse = this._vincenty_inverse(L.latLng(latlngs[poly][points]), L.latLng(latlngs[poly][points + 1]));
          var prev = L.latLng(latlngs[poly][points]);
          _geo[_geocnt].push(prev);
          for (s = 1; s <= this.options.steps;) {
            var direct = this._vincenty_direct(L.latLng(latlngs[poly][points]), inverse.initialBearing, inverse.distance / this.options.steps * s - inverse.distance / this.options.steps * (1 - this.options.dash), this.options.wrap);
            var gp = L.latLng(direct.lat, direct.lng);
            if (Math.abs(gp.lng - prev.lng) > 180) {
              var sec = this._intersection(L.latLng(latlngs[poly][points]), inverse.initialBearing, {
                lat: -89,
                lng: ((gp.lng - prev.lng) > 0) ? -INTERSECT_LNG : INTERSECT_LNG
              }, 0);
              if (sec) {
                _geo[_geocnt].push(L.latLng(sec.lat, sec.lng));
                _geocnt++;
                _geo[_geocnt] = [];
                prev = L.latLng(sec.lat, -sec.lng);
                _geo[_geocnt].push(prev);
              } else {
                _geocnt++;
                _geo[_geocnt] = [];
                _geo[_geocnt].push(gp);
                prev = gp;
                s++;
              }
            } else {
              _geo[_geocnt].push(gp);
              _geocnt++;
              var direct2 = this._vincenty_direct(L.latLng(latlngs[poly][points]), inverse.initialBearing, inverse.distance / this.options.steps * s, this.options.wrap);
              _geo[_geocnt] = [];
              _geo[_geocnt].push(L.latLng(direct2.lat, direct2.lng));
              s++;
            }
          }
        }
        _geocnt++;
      }
      return _geo;
    },


    /**
    * Vincenty direct calculation.
    * based on the work of Chris Veness (https://github.com/chrisveness/geodesy)
    *
    * @private
    * @param {number} initialBearing - Initial bearing in degrees from north.
    * @param {number} distance - Distance along bearing in metres.
    * @returns (Object} Object including point (destination point), finalBearing.
    */

    _vincenty_direct: function(p1, initialBearing, distance, wrap) {
      var φ1 = p1.lat.toRadians(),
        λ1 = p1.lng.toRadians();
      var α1 = initialBearing.toRadians();
      var s = distance;

      var a = this.datum.ellipsoid.a,
        b = this.datum.ellipsoid.b,
        f = this.datum.ellipsoid.f;

      var sinα1 = Math.sin(α1);
      var cosα1 = Math.cos(α1);

      var tanU1 = (1 - f) * Math.tan(φ1),
        cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)),
        sinU1 = tanU1 * cosU1;
      var σ1 = Math.atan2(tanU1, cosα1);
      var sinα = cosU1 * sinα1;
      var cosSqα = 1 - sinα * sinα;
      var uSq = cosSqα * (a * a - b * b) / (b * b);
      var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
      var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

      var σ = s / (b * A),
        σʹ, iterations = 0;
      do {
        var cos2σM = Math.cos(2 * σ1 + σ);
        var sinσ = Math.sin(σ);
        var cosσ = Math.cos(σ);
        var Δσ = B * sinσ * (cos2σM + B / 4 * (cosσ * (-1 + 2 * cos2σM * cos2σM) -
          B / 6 * cos2σM * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σM * cos2σM)));
        σʹ = σ;
        σ = s / (b * A) + Δσ;
      } while (Math.abs(σ - σʹ) > 1e-12 && ++iterations);

      var x = sinU1 * sinσ - cosU1 * cosσ * cosα1;
      var φ2 = Math.atan2(sinU1 * cosσ + cosU1 * sinσ * cosα1, (1 - f) * Math.sqrt(sinα * sinα + x * x));
      var λ = Math.atan2(sinσ * sinα1, cosU1 * cosσ - sinU1 * sinσ * cosα1);
      var C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
      var L = λ - (1 - C) * f * sinα *
        (σ + C * sinσ * (cos2σM + C * cosσ * (-1 + 2 * cos2σM * cos2σM)));

      if (wrap)
        var λ2 = (λ1 + L + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180...+180
      else
        var λ2 = (λ1 + L); // do not normalize

      var revAz = Math.atan2(sinα, -x);

      return {
        lat: φ2.toDegrees(),
        lng: λ2.toDegrees(),
        finalBearing: revAz.toDegrees()
      };
    },

    /**
    * Vincenty inverse calculation.
    * based on the work of Chris Veness (https://github.com/chrisveness/geodesy)
    *
    * @private
    * @param {LatLng} p1 - Latitude/longitude of start point.
    * @param {LatLng} p2 - Latitude/longitude of destination point.
    * @returns {Object} Object including distance, initialBearing, finalBearing.
    * @throws {Error} If formula failed to converge.
    */
    _vincenty_inverse: function (p1, p2) {
      var φ1 = p1.lat.toRadians(), λ1 = p1.lng.toRadians();
      var φ2 = p2.lat.toRadians(), λ2 = p2.lng.toRadians();

      var a = this.datum.ellipsoid.a, b = this.datum.ellipsoid.b, f = this.datum.ellipsoid.f;

      var L = λ2 - λ1;
      var tanU1 = (1-f) * Math.tan(φ1), cosU1 = 1 / Math.sqrt((1 + tanU1*tanU1)), sinU1 = tanU1 * cosU1;
      var tanU2 = (1-f) * Math.tan(φ2), cosU2 = 1 / Math.sqrt((1 + tanU2*tanU2)), sinU2 = tanU2 * cosU2;

      var λ = L, λʹ, iterations = 0;
      do {
	  var sinλ = Math.sin(λ), cosλ = Math.cos(λ);
	  var sinSqσ = (cosU2*sinλ) * (cosU2*sinλ) + (cosU1*sinU2-sinU1*cosU2*cosλ) * (cosU1*sinU2-sinU1*cosU2*cosλ);
	  var sinσ = Math.sqrt(sinSqσ);
	  if (sinσ==0) return 0;  // co-incident points
	  var cosσ = sinU1*sinU2 + cosU1*cosU2*cosλ;
	  var σ = Math.atan2(sinσ, cosσ);
	  var sinα = cosU1 * cosU2 * sinλ / sinσ;
	  var cosSqα = 1 - sinα*sinα;
	  var cos2σM = cosσ - 2*sinU1*sinU2/cosSqα;
	  if (isNaN(cos2σM)) cos2σM = 0;  // equatorial line: cosSqα=0 (§6)
	  var C = f/16*cosSqα*(4+f*(4-3*cosSqα));
	  λʹ = λ;
	  λ = L + (1-C) * f * sinα * (σ + C*sinσ*(cos2σM+C*cosσ*(-1+2*cos2σM*cos2σM)));
      } while (Math.abs(λ-λʹ) > 1e-12 && ++iterations<100);
      if (iterations>=100) {
	console.log('Formula failed to converge. Altering target position.')
	return this._vincenty_inverse(p1, {lat: p2.lat, lng:p2.lng-0.01})
//	throw new Error('Formula failed to converge');
      }

      var uSq = cosSqα * (a*a - b*b) / (b*b);
      var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
      var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
      var Δσ = B*sinσ*(cos2σM+B/4*(cosσ*(-1+2*cos2σM*cos2σM)-
	  B/6*cos2σM*(-3+4*sinσ*sinσ)*(-3+4*cos2σM*cos2σM)));

      var s = b*A*(σ-Δσ);

      var fwdAz = Math.atan2(cosU2*sinλ,  cosU1*sinU2-sinU1*cosU2*cosλ);
      var revAz = Math.atan2(cosU1*sinλ, -sinU1*cosU2+cosU1*sinU2*cosλ);

      s = Number(s.toFixed(3)); // round to 1mm precision
      return { distance: s, initialBearing: fwdAz.toDegrees(), finalBearing: revAz.toDegrees() };
    },


    /**
    * Returns the point of intersection of two paths defined by point and bearing.
    * based on the work of Chris Veness (https://github.com/chrisveness/geodesy)
    *
    * @param {LatLon} p1 - First point.
    * @param {number} brng1 - Initial bearing from first point.
    * @param {LatLon} p2 - Second point.
    * @param {number} brng2 - Initial bearing from second point.
    * @returns {Object} containing lat/lng information of intersection.
    *
    * @example
    * var p1 = LatLon(51.8853, 0.2545), brng1 = 108.55;
    * var p2 = LatLon(49.0034, 2.5735), brng2 = 32.44;
    * var pInt = LatLon.intersection(p1, brng1, p2, brng2); // pInt.toString(): 50.9078°N, 4.5084°E
    */
    _intersection : function(p1, brng1, p2, brng2) {
    // see http://williams.best.vwh.net/avform.htm#Intersection

      var φ1 = p1.lat.toRadians(), λ1 = p1.lng.toRadians();
      var φ2 = p2.lat.toRadians(), λ2 = p2.lng.toRadians();
      var θ13 = Number(brng1).toRadians(), θ23 = Number(brng2).toRadians();
      var Δφ = φ2-φ1, Δλ = λ2-λ1;

      var δ12 = 2*Math.asin( Math.sqrt( Math.sin(Δφ/2)*Math.sin(Δφ/2) +
	  Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2) ) );
      if (δ12 == 0) return null;

      // initial/final bearings between points
      var θ1 = Math.acos( ( Math.sin(φ2) - Math.sin(φ1)*Math.cos(δ12) ) /
			  ( Math.sin(δ12)*Math.cos(φ1) ) );
      if (isNaN(θ1)) θ1 = 0; // protect against rounding
      var θ2 = Math.acos( ( Math.sin(φ1) - Math.sin(φ2)*Math.cos(δ12) ) /
			  ( Math.sin(δ12)*Math.cos(φ2) ) );

      if (Math.sin(λ2-λ1) > 0) {
	  var θ12 = θ1;
	  var θ21 = 2*Math.PI - θ2;
      } else {
	  var θ12 = 2*Math.PI - θ1;
	  var θ21 = θ2;
      }

      var α1 = (θ13 - θ12 + Math.PI) % (2*Math.PI) - Math.PI; // angle 2-1-3
      var α2 = (θ21 - θ23 + Math.PI) % (2*Math.PI) - Math.PI; // angle 1-2-3

      if (Math.sin(α1)==0 && Math.sin(α2)==0) return null; // infinite intersections
      if (Math.sin(α1)*Math.sin(α2) < 0) return null; // ambiguous intersection

      //α1 = Math.abs(α1);
      //α2 = Math.abs(α2);
      // ... Ed Williams takes abs of α1/α2, but seems to break calculation?

      var α3 = Math.acos( -Math.cos(α1)*Math.cos(α2) +
			  Math.sin(α1)*Math.sin(α2)*Math.cos(δ12) );
      var δ13 = Math.atan2( Math.sin(δ12)*Math.sin(α1)*Math.sin(α2),
			    Math.cos(α2)+Math.cos(α1)*Math.cos(α3) )
      var φ3 = Math.asin( Math.sin(φ1)*Math.cos(δ13) +
			  Math.cos(φ1)*Math.sin(δ13)*Math.cos(θ13) );
      var Δλ13 = Math.atan2( Math.sin(θ13)*Math.sin(δ13)*Math.cos(φ1),
			    Math.cos(δ13)-Math.sin(φ1)*Math.sin(φ3) );
      var λ3 = λ1 + Δλ13;
      λ3 = (λ3+3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180º

      return {lat: φ3.toDegrees(),
	      lng: λ3.toDegrees()
      };
    },

  /**
  * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
  * @param obj1
  * @param obj2
  * @returns obj3 a new object based on obj1 and obj2
  */
    _merge_options: function(obj1,obj2){
      var obj3 = {};
      for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
      for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
      return obj3;
    }
});

L.geodesic = function(latlngs, options) {
    return new L.Geodesic(latlngs, options);
};

// Hook into L.GeoJSON.geometryToLayer and add geodesic support
(function (){
    var orig_L_GeoJSON_geometryToLayer = L.GeoJSON.geometryToLayer;
    L.GeoJSON.geometryToLayer = function (geojson, pointToLayer, coordsToLatLng, vectorOptions) {
        if (geojson.properties && geojson.properties.geodesic){
            var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
                coords = geometry.coordinates, props = geojson.properties, latlngs;
            coordsToLatLng = coordsToLatLng || this.coordsToLatLng;
            if (props.geodesic_steps) vectorOptions = L.extend({steps: props.geodesic_steps}, vectorOptions);
            if (props.geodesic_wrap) vectorOptions = L.extend({wrap: props.geodesic_wrap}, vectorOptions);
            switch (geometry.type) {
                case 'LineString':
                    latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);
                    return new L.Geodesic([latlngs], vectorOptions);
                case 'MultiLineString':
                    latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
                    return new L.Geodesic(latlngs, vectorOptions);
                default:
                    console.log('Not yet supported drawing GeoJSON ' + geometry.type + ' as a geodesic: Drawing as non-geodesic.')
            }
        }
        return orig_L_GeoJSON_geometryToLayer.apply(this, arguments);
    }
})();



L.LineUtil.PolylineDecorator = {
    computeAngle: function(a, b) {
        return (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI) + 90;
    },

    getPointPathPixelLength: function(pts) {
        var nbPts = pts.length;
        if(nbPts < 2) {
            return 0;
        }
        var dist = 0,
            prevPt = pts[0],
            pt;
        for(var i=1; i<nbPts; i++) {
            dist += prevPt.distanceTo(pt = pts[i]);
            prevPt = pt;
        }
        return dist;
    },

    getPixelLength: function(pl, map) {
        var ll = (pl instanceof L.Polyline) ? pl.getLatLngs() : pl,
            nbPts = ll.length;
        if(nbPts < 2) {
            return 0;
        }
        var dist = 0,
            prevPt = map.project(ll[0]), pt;
        for(var i=1; i<nbPts; i++) {
            dist += prevPt.distanceTo(pt = map.project(ll[i]));
            prevPt = pt;
        }
        return dist;
    },

    /**
    * path: array of L.LatLng
    * offsetRatio: the ratio of the total pixel length where the pattern will start
    * endOffsetRatio: the ratio of the total pixel length where the pattern will end
    * repeatRatio: the ratio of the total pixel length between two points of the pattern
    * map: the map, to access the current projection state
    */
    projectPatternOnPath: function (path, offsetRatio, endOffsetRatio, repeatRatio, map) {
        var pathAsPoints = [], i;
        var length = path.length;
        for(i = 0; i < length; i++) {
            pathAsPoints[i] = map.project(path[i]);
        }
        // project the pattern as pixel points
        var pattern = this.projectPatternOnPointPath(pathAsPoints, offsetRatio, endOffsetRatio, repeatRatio);
        // and convert it to latlngs;
        var patternLength = pattern.length;
        for(i = 0; i < patternLength; i++) {
          pattern[i].latLng = map.unproject(pattern[i].pt);
        }
        return pattern;
    },

    projectPatternOnPointPath: function (pts, offsetRatio, endOffsetRatio, repeatRatio) {
        var positions = [];
        // 1. compute the absolute interval length in pixels
        var repeatIntervalLength = this.getPointPathPixelLength(pts) * repeatRatio;
        // 2. find the starting point by using the offsetRatio and find the last pixel using endOffsetRatio
        var previous = this.interpolateOnPointPath(pts, offsetRatio);
        var endOffsetPixels = endOffsetRatio > 0 ? this.getPointPathPixelLength(pts) * endOffsetRatio : 0;

        positions.push(previous);
        if(repeatRatio > 0) {
            // 3. consider only the rest of the path, starting at the previous point
            var remainingPath = pts;
            remainingPath = remainingPath.slice(previous.predecessor);

            remainingPath[0] = previous.pt;
            var remainingLength = this.getPointPathPixelLength(remainingPath);

            // 4. project as a ratio of the remaining length,
            // and repeat while there is room for another point of the pattern

            while(repeatIntervalLength <= remainingLength-endOffsetPixels) {
                previous = this.interpolateOnPointPath(remainingPath, repeatIntervalLength/remainingLength);
                positions.push(previous);
                remainingPath = remainingPath.slice(previous.predecessor);
                remainingPath[0] = previous.pt;
                remainingLength = this.getPointPathPixelLength(remainingPath);
            }
        }
        return positions;
    },

    /**
    * pts: array of L.Point
    * ratio: the ratio of the total length where the point should be computed
    * Returns null if ll has less than 2 LatLng, or an object with the following properties:
    *    latLng: the LatLng of the interpolated point
    *    predecessor: the index of the previous vertex on the path
    *    heading: the heading of the path at this point, in degrees
    */
    interpolateOnPointPath: function (pts, ratio) {
        var nbVertices = pts.length;

        if (nbVertices < 2) {
            return null;
        }
        // easy limit cases: ratio negative/zero => first vertex
        if (ratio <= 0) {
            return {
                pt: pts[0],
                predecessor: 0,
                heading: this.computeAngle(pts[0], pts[1])
            };
        }
        // ratio >=1 => last vertex
        if (ratio >= 1) {
            return {
                pt: pts[nbVertices - 1],
                predecessor: nbVertices - 1,
                heading: this.computeAngle(pts[nbVertices - 2], pts[nbVertices - 1])
            };
        }
        // 1-segment-only path => direct linear interpolation
        if (nbVertices == 2) {
            return {
                pt: this.interpolateBetweenPoints(pts[0], pts[1], ratio),
                predecessor: 0,
                heading: this.computeAngle(pts[0], pts[1])
            };
        }

        var pathLength = this.getPointPathPixelLength(pts);
        var a = pts[0], b = a,
            ratioA = 0, ratioB = 0,
            distB = 0;
        // follow the path segments until we find the one
        // on which the point must lie => [ab]
        var i = 1;
        for (; i < nbVertices && ratioB < ratio; i++) {
            a = b;
            ratioA = ratioB;
            b = pts[i];
            distB += a.distanceTo(b);
            ratioB = distB / pathLength;
        }

        // compute the ratio relative to the segment [ab]
        var segmentRatio = (ratio - ratioA) / (ratioB - ratioA);

        return {
            pt: this.interpolateBetweenPoints(a, b, segmentRatio),
            predecessor: i-2,
            heading: this.computeAngle(a, b)
        };
    },

    /**
    * Finds the point which lies on the segment defined by points A and B,
    * at the given ratio of the distance from A to B, by linear interpolation.
    */
    interpolateBetweenPoints: function (ptA, ptB, ratio) {
        if(ptB.x != ptA.x) {
            return new L.Point(
                (ptA.x * (1 - ratio)) + (ratio * ptB.x),
                (ptA.y * (1 - ratio)) + (ratio * ptB.y)
            );
        }
        // special case where points lie on the same vertical axis
        return new L.Point(ptA.x, ptA.y + (ptB.y - ptA.y) * ratio);
    }
};



L.PolylineDecorator = L.FeatureGroup.extend({
    options: {
        patterns: []
    },

    initialize: function(paths, options) {
        L.FeatureGroup.prototype.initialize.call(this);
        L.Util.setOptions(this, options);
        this._map = null;
        this._initPaths(paths);
        this._initPatterns();
    },

    /**
    * Deals with all the different cases. p can be one of these types:
    * array of LatLng, array of 2-number arrays, Polyline, Polygon,
    * array of one of the previous.
    */
    _initPaths: function(p) {
        this._paths = [];
        var isPolygon = false;
        if(p instanceof L.Polyline) {
            this._initPath(p.getLatLngs(), (p instanceof L.Polygon));
        } else if(L.Util.isArray(p) && p.length > 0) {
            if(p[0] instanceof L.Polyline) {
                for(var i=0; i<p.length; i++) {
                    this._initPath(p[i].getLatLngs(), (p[i] instanceof L.Polygon));
                }
            } else {
                this._initPath(p);
            }
        }
    },

    _isCoordArray: function(ll) {
        return(L.Util.isArray(ll) && ll.length > 0 && (
            ll[0] instanceof L.LatLng ||
            (L.Util.isArray(ll[0]) && ll[0].length == 2 && typeof ll[0][0] === 'number')
        ));
    },

    _initPath: function(path, isPolygon) {
        var latLngs;
        // It may still be an array of array of coordinates
        // (ex: polygon with rings)
        if(this._isCoordArray(path)) {
            latLngs = [path];
        } else {
            latLngs = path;
        }
        for(var i=0; i<latLngs.length; i++) {
            // As of Leaflet >= v0.6, last polygon vertex (=first) isn't repeated.
            // Our algorithm needs it, so we add it back explicitly.
            if(isPolygon) {
                latLngs[i].push(latLngs[i][0]);
            }
            this._paths.push(latLngs[i]);
        }
    },

    _initPatterns: function() {
        this._isZoomDependant = false;
        this._patterns = [];
        var pattern;
        // parse pattern definitions and precompute some values
        for(var i=0;i<this.options.patterns.length;i++) {
            pattern = this._parsePatternDef(this.options.patterns[i]);
            this._patterns.push(pattern);
            // determines if we have to recompute the pattern on each zoom change
            this._isZoomDependant = this._isZoomDependant ||
                pattern.isOffsetInPixels ||
                pattern.isEndOffsetInPixels ||
                pattern.isRepeatInPixels ||
                pattern.symbolFactory.isZoomDependant;
        }
    },

    /**
    * Changes the patterns used by this decorator
    * and redraws the new one.
    */
    setPatterns: function(patterns) {
        this.options.patterns = patterns;
        this._initPatterns();
        this._softRedraw();
    },

    /**
    * Changes the patterns used by this decorator
    * and redraws the new one.
    */
    setPaths: function(paths) {
        this._initPaths(paths);
        this.redraw();
    },

    /**
    * Parse the pattern definition
    */
    _parsePatternDef: function(patternDef, latLngs) {
        var pattern = {
            cache: [],
            symbolFactory: patternDef.symbol,
            isOffsetInPixels: false,
            isEndOffsetInPixels: false,
            isRepeatInPixels: false
        };

        // Parse offset and repeat values, managing the two cases:
        // absolute (in pixels) or relative (in percentage of the polyline length)
        if(typeof patternDef.offset === 'string' && patternDef.offset.indexOf('%') != -1) {
            pattern.offset = parseFloat(patternDef.offset) / 100;
        } else {
            pattern.offset = patternDef.offset ? parseFloat(patternDef.offset) : 0;
            pattern.isOffsetInPixels = (pattern.offset > 0);
        }

        if(typeof patternDef.endOffset === 'string' && patternDef.endOffset.indexOf('%') != -1) {
            pattern.endOffset = parseFloat(patternDef.endOffset) / 100;
        } else {
            pattern.endOffset = patternDef.endOffset ? parseFloat(patternDef.endOffset) : 0;
            pattern.isEndOffsetInPixels = (pattern.endOffset > 0);
        }

        if(typeof patternDef.repeat === 'string' && patternDef.repeat.indexOf('%') != -1) {
            pattern.repeat = parseFloat(patternDef.repeat) / 100;
        } else {
            pattern.repeat = parseFloat(patternDef.repeat);
            pattern.isRepeatInPixels = (pattern.repeat > 0);
        }

        return(pattern);
    },

    onAdd: function (map) {
        this._map = map;
        this._draw();
        // listen to zoom changes to redraw pixel-spaced patterns
        if(this._isZoomDependant) {
            this._map.on('zoomend', this._softRedraw, this);
        }
    },

    onRemove: function (map) {
        // remove optional map zoom listener
        this._map.off('zoomend', this._softRedraw, this);
        this._map = null;
        L.LayerGroup.prototype.onRemove.call(this, map);
    },

    /**
    * Returns an array of ILayers object
    */
    _buildSymbols: function(latLngs, symbolFactory, directionPoints) {
        var symbols = [];
        var directionPointsLength = directionPoints.length;
        for(var i = 0; i < directionPointsLength; i++) {
            symbols.push(symbolFactory.buildSymbol(directionPoints[i], latLngs, this._map, i, directionPointsLength));
        }
        return symbols;
    },

    _getCache: function(pattern, zoom, pathIndex) {
        var zoomCache = pattern.cache[zoom];
        if(typeof zoomCache === 'undefined') {
            pattern.cache[zoom] = [];
            return null;
        }
        return zoomCache[pathIndex];
    },

    /**
    * Select pairs of LatLng and heading angle,
    * that define positions and directions of the symbols
    * on the path
    */
    _getDirectionPoints: function(pathIndex, pattern) {
        var zoom = this._map.getZoom();
        var dirPoints = this._getCache(pattern, zoom, pathIndex);
        if(dirPoints) {
            return dirPoints;
        }

        var offset, endOffset, repeat, pathPixelLength = null, latLngs = this._paths[pathIndex];
        if(pattern.isOffsetInPixels) {
            pathPixelLength =  L.LineUtil.PolylineDecorator.getPixelLength(latLngs, this._map);
            offset = pattern.offset/pathPixelLength;
        } else {
            offset = pattern.offset;
        }
        if(pattern.isEndOffsetInPixels) {
            pathPixelLength = (pathPixelLength !== null) ? pathPixelLength : L.LineUtil.PolylineDecorator.getPixelLength(latLngs, this._map);
            endOffset = pattern.endOffset/pathPixelLength;
        } else {
            endOffset = pattern.endOffset;
        }
        if(pattern.isRepeatInPixels) {
            pathPixelLength = (pathPixelLength !== null) ? pathPixelLength : L.LineUtil.PolylineDecorator.getPixelLength(latLngs, this._map);
            repeat = pattern.repeat/pathPixelLength;
        } else {
            repeat = pattern.repeat;
        }
        dirPoints = L.LineUtil.PolylineDecorator.projectPatternOnPath(latLngs, offset, endOffset, repeat, this._map);
        // save in cache to avoid recomputing this
        pattern.cache[zoom][pathIndex] = dirPoints;

        return dirPoints;
    },

    /**
    * Public redraw, invalidating the cache.
    */
    redraw: function() {
        this._redraw(true);
    },

    /**
    * "Soft" redraw, called internally for example on zoom changes,
    * keeping the cache.
    */
    _softRedraw: function() {
        this._redraw(false);
    },

    _redraw: function(clearCache) {
        if(this._map === null)
            return;
        this.clearLayers();
        if(clearCache) {
            for(var i=0; i<this._patterns.length; i++) {
                this._patterns[i].cache = [];
            }
        }
        this._draw();
    },

    /**
    * Draw a single pattern
    */
    _drawPattern: function(pattern) {
        var directionPoints, symbols;
        for(var i=0; i < this._paths.length; i++) {
            directionPoints = this._getDirectionPoints(i, pattern);
            symbols = this._buildSymbols(this._paths[i], pattern.symbolFactory, directionPoints);
            for(var j=0; j < symbols.length; j++) {
                this.addLayer(symbols[j]);
            }
        }
    },

    /**
    * Draw all patterns
    */
    _draw: function () {
        for(var i=0; i<this._patterns.length; i++) {
            this._drawPattern(this._patterns[i]);
        }
    }
});
/*
 * Allows compact syntax to be used
 */
L.polylineDecorator = function (paths, options) {
    return new L.PolylineDecorator(paths, options);
};

L.RotatedMarker = L.Marker.extend({
    options: {
        angle: 0
    },

    statics: {
        TRANSFORM_ORIGIN: L.DomUtil.testProp(
            ['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin'])
    },

    _initIcon: function() {
        L.Marker.prototype._initIcon.call(this);

        this._icon.style[L.RotatedMarker.TRANSFORM_ORIGIN] = this._getTransformOrigin();
    },

    _getTransformOrigin: function() {
        var iconAnchor = this.options.icon.options.iconAnchor;

        if (!iconAnchor) {
            return '50% 50%';
        }

        return iconAnchor[0] + 'px ' + iconAnchor[1] + 'px';
    },

    _setPos: function (pos) {
        L.Marker.prototype._setPos.call(this, pos);

        if (L.DomUtil.TRANSFORM) {
            // use the CSS transform rule if available
            this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
        } else if(L.Browser.ie) {
            // fallback for IE6, IE7, IE8
            var rad = this.options.angle * (Math.PI / 180),
                costheta = Math.cos(rad),
                sintheta = Math.sin(rad);
            this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' +
                costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';
        }
    },

    setAngle: function (ang) {
        this.options.angle = ang;
    }
});

L.rotatedMarker = function (pos, options) {
    return new L.RotatedMarker(pos, options);
};

/**
* Defines several classes of symbol factories,
* to be used with L.PolylineDecorator
*/

L.Symbol = L.Symbol || {};

/**
* A simple dash symbol, drawn as a Polyline.
* Can also be used for dots, if 'pixelSize' option is given the 0 value.
*/
L.Symbol.Dash = L.Class.extend({
    isZoomDependant: true,

    options: {
        pixelSize: 10,
        pathOptions: { }
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this.options.pathOptions.clickable = false;
    },

    buildSymbol: function(dirPoint, latLngs, map, index, total) {
        var opts = this.options,
            d2r = Math.PI / 180;

        // for a dot, nothing more to compute
        if(opts.pixelSize <= 1) {
            return new L.Polyline([dirPoint.latLng, dirPoint.latLng], opts.pathOptions);
        }

        var midPoint = map.project(dirPoint.latLng);
        var angle = (-(dirPoint.heading - 90)) * d2r;
        var a = new L.Point(
                midPoint.x + opts.pixelSize * Math.cos(angle + Math.PI) / 2,
                midPoint.y + opts.pixelSize * Math.sin(angle) / 2
            );
        // compute second point by central symmetry to avoid unecessary cos/sin
        var b = midPoint.add(midPoint.subtract(a));
        return new L.Polyline([map.unproject(a), map.unproject(b)], opts.pathOptions);
    }
});

L.Symbol.dash = function (options) {
    return new L.Symbol.Dash(options);
};

L.Symbol.ArrowHead = L.Class.extend({
    isZoomDependant: true,

    options: {
        polygon: true,
        pixelSize: 10,
        headAngle: 60,
        pathOptions: {
            stroke: false,
            weight: 2
        }
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this.options.pathOptions.clickable = false;
    },

    buildSymbol: function(dirPoint, latLngs, map, index, total) {
        var opts = this.options;
        var path;
        if(opts.polygon) {
            path = new L.Polygon(this._buildArrowPath(dirPoint, map), opts.pathOptions);
        } else {
            path = new L.Polyline(this._buildArrowPath(dirPoint, map), opts.pathOptions);
        }
        return path;
    },

    _buildArrowPath: function (dirPoint, map) {
        var d2r = Math.PI / 180;
        var tipPoint = map.project(dirPoint.latLng);
        var direction = (-(dirPoint.heading - 90)) * d2r;
        var radianArrowAngle = this.options.headAngle / 2 * d2r;

        var headAngle1 = direction + radianArrowAngle,
            headAngle2 = direction - radianArrowAngle;
        var arrowHead1 = new L.Point(
                tipPoint.x - this.options.pixelSize * Math.cos(headAngle1),
                tipPoint.y + this.options.pixelSize * Math.sin(headAngle1)),
            arrowHead2 = new L.Point(
                tipPoint.x - this.options.pixelSize * Math.cos(headAngle2),
                tipPoint.y + this.options.pixelSize * Math.sin(headAngle2));

        return [
            map.unproject(arrowHead1),
            dirPoint.latLng,
            map.unproject(arrowHead2)
        ];
    }
});

L.Symbol.arrowHead = function (options) {
    return new L.Symbol.ArrowHead(options);
};

L.Symbol.Marker = L.Class.extend({
    isZoomDependant: false,

    options: {
        markerOptions: { },
        rotate: false
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this.options.markerOptions.clickable = false;
        this.options.markerOptions.draggable = false;
        this.isZoomDependant = (L.Browser.ie && this.options.rotate);
    },

    buildSymbol: function(directionPoint, latLngs, map, index, total) {
        if(!this.options.rotate) {
            return new L.Marker(directionPoint.latLng, this.options.markerOptions);
        }
        else {
            this.options.markerOptions.angle = directionPoint.heading + (this.options.angleCorrection || 0);
            return new L.RotatedMarker(directionPoint.latLng, this.options.markerOptions);
        }
    }
});

L.Symbol.marker = function (options) {
  return new L.Symbol.Marker(options);
};

};

export default plugins;
