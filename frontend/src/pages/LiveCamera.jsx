import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatDate } from '../utils/helpers';

export default function LiveCamera() {
  const [cameras, setCameras] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusRes, logsRes] = await Promise.all([
          api.camera.getStatus(),
          api.camera.getLogs(),
        ]);
        const cams = statusRes.data || [];
        setCameras(cams);
        setLogs(logsRes.data || []);
        if (cams.length > 0) setSelectedCamera(cams[0]);
      } catch (err) {
        console.error('Camera fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg" />
            <div className="lg:col-span-2 h-80 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const cameraLogs = logs.filter(
    (l) => l.camera_id === selectedCamera?.id
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Camera</h1>
        <p className="text-gray-600 mt-1">
          Monitor parking areas in real-time
          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Placeholder — AI detection not yet connected
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Cameras</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setSelectedCamera(camera)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedCamera?.id === camera.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{camera.name}</p>
                      <p className="text-sm text-gray-500">
                        {camera.status === 'online' ? (
                          <span className="text-green-600">● Online</span>
                        ) : (
                          <span className="text-red-500">● Offline</span>
                        )}
                      </p>
                      {camera.linked_slot && (
                        <p className="text-xs text-gray-400 mt-1">
                          Linked: Slot {camera.linked_slot}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Camera Logs */}
          {logs.length > 0 && (
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{log.camera_id}</span>
                      <span className="text-xs text-gray-400">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-gray-600 mt-0.5">
                      {log.event.replace(/_/g, ' ')}
                      {log.plate && <span className="ml-1 font-mono text-xs">— {log.plate}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Camera Feed Placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCamera?.name || 'Select a camera'}
                </h2>
                {selectedCamera && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Last heartbeat: {selectedCamera.last_heartbeat ? formatDate(selectedCamera.last_heartbeat) : 'N/A'}
                  </p>
                )}
              </div>
              {selectedCamera && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedCamera.status === 'online'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedCamera.status}
                </span>
              )}
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Camera Feed Placeholder</p>
                <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
                  Connect your IP camera or RTSP stream source here.
                  AI vehicle detection is not yet implemented.
                </p>
                {selectedCamera?.linked_slot && (
                  <p className="text-sm text-gray-500 mt-2">
                    Linked to Slot: <span className="font-mono text-primary-400">{selectedCamera.linked_slot}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Logs for selected camera */}
            {cameraLogs.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Events for {selectedCamera.name}
                </h3>
                <div className="space-y-2">
                  {cameraLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                      <span className="text-gray-700">
                        {log.event.replace(/_/g, ' ')}
                        {log.plate && <span className="ml-2 font-mono text-xs text-gray-500">{log.plate}</span>}
                      </span>
                      <span className="text-gray-400 text-xs">{formatDate(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
