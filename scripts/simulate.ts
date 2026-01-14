// scripts/simulate-vehicles.ts
// Run this to simulate vehicle movement for testing
import { prisma } from "../lib/prisma";

// Simulate vehicle movement along a route
async function simulateMovement() {
  console.log("🚗 Starting vehicle simulation...");

  setInterval(async () => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { status: 'active' }
      });

      for (const vehicle of vehicles) {
        // Simulate small random movement (0.001 degrees ≈ 100 meters)
        const latChange = (Math.random() - 0.5) * 0.002;
        const lngChange = (Math.random() - 0.5) * 0.002;
        const newHeading = Math.random() * 360;
        const newSpeed = Math.random() * 40 + 10; // 10-50 km/h

        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            currentLat: (vehicle.currentLat || 14.7306) + latChange,
            currentLng: (vehicle.currentLng || 121.1394) + lngChange,
            heading: newHeading,
            speed: newSpeed,
            lastUpdate: new Date()
          }
        });

        // Save to location history
        await prisma.vehicleLocation.create({
          data: {
            vehicleId: vehicle.id,
            latitude: (vehicle.currentLat || 14.7306) + latChange,
            longitude: (vehicle.currentLng || 121.1394) + lngChange,
            heading: newHeading,
            speed: newSpeed
          }
        });
      }

      console.log(`✅ Updated ${vehicles.length} vehicles at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Error updating vehicles:", error);
    }
  }, 5000); // Update every 5 seconds
}

simulateMovement();
