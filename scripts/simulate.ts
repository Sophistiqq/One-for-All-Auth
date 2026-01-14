// scripts/simulate-vehicles.ts
// Run this to simulate vehicle movement for testing
import { prisma } from "../lib/prisma";

const API_URL = process.env.API_URL || "http://localhost:3000";

// Simulate vehicle movement along a route
async function simulateMovement() {
  console.log("🚗 Starting vehicle simulation...");
  console.log(`📡 Using API: ${API_URL}`);

  setInterval(async () => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { status: 'active' }
      });

      for (const vehicle of vehicles) {
        // Simulate small random movement (0.001 degrees ≈ 100 meters)
        const latChange = (Math.random() - 0.5) * 0.002;
        const lngChange = (Math.random() - 0.5) * 0.002;

        const newLat = (vehicle.currentLat || 14.7306) + latChange;
        const newLng = (vehicle.currentLng || 121.1394) + lngChange;
        const newHeading = Math.random() * 360;
        const newSpeed = Math.random() * 40 + 10; // 10-50 km/h

        // Send POST request to the API endpoint
        const response = await fetch(`${API_URL}/vehicles/${vehicle.id}/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add auth header if required
            // 'Authorization': 'Bearer YOUR_TOKEN'
          },
          body: JSON.stringify({
            latitude: newLat,
            longitude: newLng,
            heading: newHeading,
            speed: newSpeed,
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          console.error(`Failed to update vehicle ${vehicle.id}:`, response.statusText);
        }
      }

      console.log(`✅ Updated ${vehicles.length} vehicles at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Error updating vehicles:", error);
    }
  }, 500); // Update every 3 seconds
}

simulateMovement();
