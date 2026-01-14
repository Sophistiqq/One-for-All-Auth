// prisma/seed.ts
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // Create terminals
  const montalbanTerminal = await prisma.terminal.create({
    data: {
      name: "Montalban Terminal",
      latitude: 14.7306,
      longitude: 121.1394,
      address: "San Jose Rodriguez, Montalban, Rizal",
      type: "terminal"
    }
  });

  const farmersTerminal = await prisma.terminal.create({
    data: {
      name: "Farmers Plaza",
      latitude: 14.6091,
      longitude: 121.0583,
      address: "Araneta Center, Cubao, Quezon City",
      type: "terminal"
    }
  });

  const smNorthTerminal = await prisma.terminal.create({
    data: {
      name: "SM North EDSA",
      latitude: 14.6560,
      longitude: 121.0294,
      address: "North Avenue, Quezon City",
      type: "terminal"
    }
  });

  console.log("✅ Created terminals");

  // Create routes
  const montalbanCubaoRoute = await prisma.route.create({
    data: {
      name: "Montalban - Cubao",
      code: "MC-01",
      description: "Via Marikina-Infanta Highway",
      fare: 45.0,
      color: "#2a9d8f",
      startTerminal: "Montalban Terminal",
      endTerminal: "Farmers Plaza",
      operatingHours: "5:00 AM - 10:00 PM",
      isActive: true
    }
  });

  const montalbanSMNorthRoute = await prisma.route.create({
    data: {
      name: "Montalban - SM North",
      code: "MSN-01",
      description: "Via Commonwealth Avenue",
      fare: 50.0,
      color: "#e76f51",
      startTerminal: "Montalban Terminal",
      endTerminal: "SM North EDSA",
      operatingHours: "5:00 AM - 11:00 PM",
      isActive: true
    }
  });

  console.log("✅ Created routes");

  // Link routes to terminals
  await prisma.routeStop.createMany({
    data: [
      { routeId: montalbanCubaoRoute.id, terminalId: montalbanTerminal.id, sequence: 1 },
      { routeId: montalbanCubaoRoute.id, terminalId: farmersTerminal.id, sequence: 2 },
      { routeId: montalbanSMNorthRoute.id, terminalId: montalbanTerminal.id, sequence: 1 },
      { routeId: montalbanSMNorthRoute.id, terminalId: smNorthTerminal.id, sequence: 2 }
    ]
  });

  console.log("✅ Created route stops");

  // Create drivers
  const driver1 = await prisma.driver.create({
    data: {
      firstName: "Juan",
      lastName: "Dela Cruz",
      phone: "+639171234567",
      licenseNo: "N01-12-345678",
      isActive: true
    }
  });

  const driver2 = await prisma.driver.create({
    data: {
      firstName: "Pedro",
      lastName: "Santos",
      phone: "+639181234567",
      licenseNo: "N01-12-345679",
      isActive: true
    }
  });

  console.log("✅ Created drivers");

  // Create vehicles
  const vehicles = await prisma.vehicle.createMany({
    data: [
      {
        plateNumber: "ABC-1234",
        type: "jeepney",
        capacity: 20,
        routeId: montalbanCubaoRoute.id,
        status: "active",
        currentLat: 14.7306,
        currentLng: 121.1394,
        heading: 180,
        speed: 0,
        driverId: driver1.id,
        lastUpdate: new Date()
      },
      {
        plateNumber: "XYZ-5678",
        type: "jeepney",
        capacity: 20,
        routeId: montalbanCubaoRoute.id,
        status: "active",
        currentLat: 14.6500,
        currentLng: 121.0800,
        heading: 45,
        speed: 25,
        driverId: driver2.id,
        lastUpdate: new Date()
      },
      {
        plateNumber: "DEF-9012",
        type: "uv_express",
        capacity: 14,
        routeId: montalbanSMNorthRoute.id,
        status: "active",
        currentLat: 14.7200,
        currentLng: 121.1300,
        heading: 270,
        speed: 30,
        lastUpdate: new Date()
      }
    ]
  });

  console.log("✅ Created vehicles");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
