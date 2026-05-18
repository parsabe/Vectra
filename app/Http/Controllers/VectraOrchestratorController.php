<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VectraOrchestratorController extends Controller
{
    public function segmentObject(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|string',
            'coordinates' => 'required|array|size:2',
        ]);

        try {
            $pythonApi = env('PYTHON_API_URL', 'http://localhost:8000');
            $response = Http::post("{$pythonApi}/segment", $validated);

            if ($response->successful()) return response()->json($response->json());
            return response()->json(['error' => 'AI Server segmentation failed.'], $response->status());
        } catch (\Exception $e) {
            Log::error("Segmentation Data-jack Error: " . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    public function generateMesh(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|string',
            'prompt' => 'required|string|max:255',
        ]);

        try {
            $pythonApi = env('PYTHON_API_URL', 'http://localhost:8000');
            $response = Http::post("{$pythonApi}/generate-3d", $validated);

            if ($response->successful()) return response()->json($response->json());
            return response()->json(['error' => 'AI Server mesh splice failed.'], $response->status());
        } catch (\Exception $e) {
            Log::error("Mesh Generation Error: " . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }
}