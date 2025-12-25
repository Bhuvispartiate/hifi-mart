import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Save, RotateCcw } from 'lucide-react';
import { getGeofenceConfig, updateGeofenceRadius, updateGeofenceCenter, GeofenceConfig } from '@/lib/geofencing';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxPublicToken } from '@/lib/mapboxToken';

const AdminSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<GeofenceConfig>(getGeofenceConfig());
  const [radiusInput, setRadiusInput] = useState(config.radiusKm.toString());
  const [isSaving, setIsSaving] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const circle = useRef<mapboxgl.GeoJSONSource | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = getMapboxPublicToken();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [config.centerLng, config.centerLat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add center marker
    marker.current = new mapboxgl.Marker({ color: '#ef4444', draggable: true })
      .setLngLat([config.centerLng, config.centerLat])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setConfig(prev => ({
          ...prev,
          centerLat: lngLat.lat,
          centerLng: lngLat.lng,
        }));
        updateCircle(lngLat.lat, lngLat.lng, config.radiusKm);
      }
    });

    // Add geofence circle
    map.current.on('load', () => {
      addCircleLayer(config.centerLat, config.centerLng, config.radiusKm);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update circle when radius changes
  useEffect(() => {
    if (map.current?.isStyleLoaded()) {
      updateCircle(config.centerLat, config.centerLng, config.radiusKm);
    }
  }, [config.radiusKm]);

  const addCircleLayer = (lat: number, lng: number, radiusKm: number) => {
    if (!map.current) return;

    const circleGeoJSON = createCircleGeoJSON(lat, lng, radiusKm);

    if (map.current.getSource('geofence-circle')) {
      (map.current.getSource('geofence-circle') as mapboxgl.GeoJSONSource).setData(circleGeoJSON);
    } else {
      map.current.addSource('geofence-circle', {
        type: 'geojson',
        data: circleGeoJSON,
      });

      map.current.addLayer({
        id: 'geofence-circle-fill',
        type: 'fill',
        source: 'geofence-circle',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.2,
        },
      });

      map.current.addLayer({
        id: 'geofence-circle-line',
        type: 'line',
        source: 'geofence-circle',
        paint: {
          'line-color': '#22c55e',
          'line-width': 3,
        },
      });
    }
  };

  const updateCircle = (lat: number, lng: number, radiusKm: number) => {
    if (!map.current) return;
    const source = map.current.getSource('geofence-circle') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(createCircleGeoJSON(lat, lng, radiusKm));
    }
  };

  const createCircleGeoJSON = (lat: number, lng: number, radiusKm: number): GeoJSON.FeatureCollection => {
    const points = 64;
    const coordinates: [number, number][] = [];
    const radiusInDegrees = radiusKm / 111.32; // Approximate conversion

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusInDegrees * Math.cos(angle);
      const dy = radiusInDegrees * Math.sin(angle) / Math.cos(lat * (Math.PI / 180));
      coordinates.push([lng + dy, lat + dx]);
    }
    coordinates.push(coordinates[0]); // Close the circle

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        },
      ],
    };
  };

  const handleSaveRadius = () => {
    const radius = parseFloat(radiusInput);
    if (isNaN(radius) || radius <= 0 || radius > 50) {
      toast({
        title: 'Invalid radius',
        description: 'Please enter a valid radius between 0.1 and 50 KM',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setConfig(prev => ({ ...prev, radiusKm: radius }));
    updateGeofenceRadius(radius);
    updateGeofenceCenter(config.centerLat, config.centerLng);
    
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Settings saved',
        description: `Geofence updated: ${radius} KM radius`,
      });
    }, 500);
  };

  const handleReset = () => {
    const defaultConfig: GeofenceConfig = {
      centerLat: 13.308798940760282,
      centerLng: 80.17290657335155,
      radiusKm: 5,
    };
    setConfig(defaultConfig);
    setRadiusInput('5');
    updateGeofenceRadius(5);
    updateGeofenceCenter(defaultConfig.centerLat, defaultConfig.centerLng);

    if (marker.current) {
      marker.current.setLngLat([defaultConfig.centerLng, defaultConfig.centerLat]);
    }
    if (map.current) {
      map.current.flyTo({ center: [defaultConfig.centerLng, defaultConfig.centerLat], zoom: 12 });
      updateCircle(defaultConfig.centerLat, defaultConfig.centerLng, 5);
    }

    toast({
      title: 'Settings reset',
      description: 'Geofence reset to default (5 KM)',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure delivery zone and other settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Delivery Zone (Geofencing)
          </CardTitle>
          <CardDescription>
            Set the delivery area. Orders outside this zone will not be accepted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map */}
          <div className="h-[400px] rounded-lg overflow-hidden border border-border">
            <div ref={mapContainer} className="w-full h-full" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Drag the red marker to change the center point. The green area shows the delivery zone.
          </p>

          {/* Radius Input */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="radius">Delivery Radius (KM)</Label>
              <Input
                id="radius"
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={radiusInput}
                onChange={(e) => setRadiusInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSaveRadius} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {/* Current Config Display */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current Configuration</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Center Lat:</span>
                <p className="font-mono">{config.centerLat.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Center Lng:</span>
                <p className="font-mono">{config.centerLng.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Radius:</span>
                <p className="font-mono">{config.radiusKm} KM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
