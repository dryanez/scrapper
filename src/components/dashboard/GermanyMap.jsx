
import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Simplified Germany states GeoJSON data - THIS IS A VERY ROUGH APPROXIMATION
const germanyStatesGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "properties": { "code": "BW", "name": "Baden-Württemberg" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 8.5, 47.5 ], [ 10.5, 47.5 ], [ 10.5, 49.5 ], [ 8.5, 49.5 ], [ 8.5, 47.5 ] ] ] } },
    { "type": "Feature", "properties": { "code": "BY", "name": "Bayern" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 9.5, 47.2 ], [ 13.8, 47.2 ], [ 13.8, 50.5 ], [ 9.5, 50.5 ], [ 9.5, 47.2 ] ] ] } },
    { "type": "Feature", "properties": { "code": "BE", "name": "Berlin" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 13.0, 52.3 ], [ 13.7, 52.3 ], [ 13.7, 52.7 ], [ 13.0, 52.7 ], [ 13.0, 52.3 ] ] ] } },
    { "type": "Feature", "properties": { "code": "BB", "name": "Brandenburg" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 11.5, 51.5 ], [ 14.8, 51.5 ], [ 14.8, 53.5 ], [ 11.5, 53.5 ], [ 11.5, 51.5 ] ] ] } },
    { "type": "Feature", "properties": { "code": "HB", "name": "Bremen" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 8.5, 53.0 ], [ 9.0, 53.0 ], [ 9.0, 53.2 ], [ 8.5, 53.2 ], [ 8.5, 53.0 ] ] ] } },
    { "type": "Feature", "properties": { "code": "HH", "name": "Hamburg" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 9.7, 53.4 ], [ 10.3, 53.4 ], [ 10.3, 53.7 ], [ 9.7, 53.7 ], [ 9.7, 53.4 ] ] ] } },
    { "type": "Feature", "properties": { "code": "HE", "name": "Hessen" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 7.8, 49.5 ], [ 10.0, 49.5 ], [ 10.0, 51.6 ], [ 7.8, 51.6 ], [ 7.8, 49.5 ] ] ] } },
    { "type": "Feature", "properties": { "code": "MV", "name": "Mecklenburg-Vorpommern" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 11.0, 53.0 ], [ 14.2, 53.0 ], [ 14.2, 54.7 ], [ 11.0, 54.7 ], [ 11.0, 53.0 ] ] ] } },
    { "type": "Feature", "properties": { "code": "NI", "name": "Niedersachsen" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.7, 51.5 ], [ 11.6, 51.5 ], [ 11.6, 53.9 ], [ 6.7, 53.9 ], [ 6.7, 51.5 ] ] ] } },
    { "type": "Feature", "properties": { "code": "NW", "name": "Nordrhein-Westfalen" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.0, 50.3 ], [ 9.5, 50.3 ], [ 9.5, 52.5 ], [ 6.0, 52.5 ], [ 6.0, 50.3 ] ] ] } },
    { "type": "Feature", "properties": { "code": "RP", "name": "Rheinland-Pfalz" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.2, 49.0 ], [ 8.5, 49.0 ], [ 8.5, 50.8 ], [ 6.2, 50.8 ], [ 6.2, 49.0 ] ] ] } },
    { "type": "Feature", "properties": { "code": "SL", "name": "Saarland" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.5, 49.1 ], [ 7.4, 49.1 ], [ 7.4, 49.6 ], [ 6.5, 49.6 ], [ 6.5, 49.1 ] ] ] } },
    { "type": "Feature", "properties": { "code": "SN", "name": "Sachsen" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 12.0, 50.2 ], [ 15.0, 50.2 ], [ 15.0, 51.7 ], [ 12.0, 51.7 ], [ 12.0, 50.2 ] ] ] } },
    { "type": "Feature", "properties": { "code": "ST", "name": "Sachsen-Anhalt" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 10.7, 51.0 ], [ 13.0, 51.0 ], [ 13.0, 53.0 ], [ 10.7, 53.0 ], [ 10.7, 51.0 ] ] ] } },
    { "type": "Feature", "properties": { "code": "SH", "name": "Schleswig-Holstein" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 8.0, 53.5 ], [ 11.0, 53.5 ], [ 11.0, 55.0 ], [ 8.0, 55.0 ], [ 8.0, 53.5 ] ] ] } },
    { "type": "Feature", "properties": { "code": "TH", "name": "Thüringen" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 9.9, 50.2 ], [ 12.6, 50.2 ], [ 12.6, 51.6 ], [ 9.9, 51.6 ], [ 9.9, 50.2 ] ] ] } }
  ]
};

// Custom Icon for Markers
const jobIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYXAtcGluIj48cGF0aCBkPSJNMjAgMTBjMC00LjQtMy42LTgtOC04cy04IDMuNi04IDh2MGMwIDQuNCAzLjYgOCg4IDggYy41IDAgMSAwIDEuNS41TDIwIDEwWiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48L3N2Zz4=',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
  popupAnchor: [0, -16],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [25, 41],
  shadowAnchor: [8, 41],
  // Use a div to create a custom marker with a background color
  className: 'bg-blue-500 rounded-full border-2 border-white'
});

export default function GermanyMap({ selectedStates, onStateSelect, jobs }) {
  const handleStateClick = (feature) => {
    const stateCode = feature.properties.code;
    const newSelection = selectedStates.includes(stateCode)
      ? selectedStates.filter(s => s !== stateCode)
      : [...selectedStates, stateCode];
    onStateSelect(newSelection);
  };

  const getStateStyle = (feature) => ({
    fillColor: selectedStates.includes(feature.properties.code) ? '#3B82F6' : '#E2E8F0',
    weight: 2,
    opacity: 1,
    color: '#64748B',
    dashArray: '3',
    fillOpacity: selectedStates.includes(feature.properties.code) ? 0.7 : 0.3
  });

  return (
    <div className="h-full relative bg-slate-50 rounded-lg overflow-hidden">
      <MapContainer
        center={[51.1657, 10.4515]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON
          data={germanyStatesGeoJSON}
          style={getStateStyle}
          onEachFeature={(feature, layer) => {
            layer.on({
              click: () => handleStateClick(feature)
            });
          }}
        />
        
        {/* Job markers */}
        {jobs
          .filter(job => job.latitude && job.longitude)
          .slice(0, 200) // Limit markers for performance
          .map(job => (
            <Marker
              key={job.id}
              position={[job.latitude, job.longitude]}
              icon={jobIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{job.title}</div>
                  <div className="text-slate-600">{job.hospitalName}</div>
                  <div className="text-slate-500">{job.city}</div>
                </div>
              </Popup>
            </Marker>
          ))
        }
      </MapContainer>
      
      {/* Map overlay with instructions */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-11/12 bg-white/80 backdrop-blur-sm rounded-lg p-2 text-xs text-center text-slate-600 shadow">
        Click states on the map to filter jobs by region.
      </div>
    </div>
  );
}
