import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketActivityLog.deleteMany();
  await prisma.fileAttachment.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  // Create users
  const sarah = await prisma.user.create({
    data: { email: "sarah@demo.com", password: hash, name: "Sarah Johnson", role: "TENANT" },
  });
  const mike = await prisma.user.create({
    data: { email: "mike@demo.com", password: hash, name: "Mike Chen", role: "TENANT" },
  });
  const raj = await prisma.user.create({
    data: { email: "raj@demo.com", password: hash, name: "Raj Patel", role: "TENANT" },
  });
  const emily = await prisma.user.create({
    data: { email: "admin@demo.com", password: hash, name: "Emily Rodriguez", role: "MANAGER" },
  });
  const john = await prisma.user.create({
    data: { email: "john@demo.com", password: hash, name: "John Smith", role: "TECHNICIAN" },
  });
  const lisa = await prisma.user.create({
    data: { email: "lisa@demo.com", password: hash, name: "Lisa Martinez", role: "TECHNICIAN" },
  });

  // Create properties
  const sunset = await prisma.property.create({
    data: { name: "Sunset Apartments", address: "123 Sunset Blvd, Los Angeles, CA 90028", managerId: emily.id },
  });
  const harbor = await prisma.property.create({
    data: { name: "Harbor View Complex", address: "456 Harbor Way, San Francisco, CA 94111", managerId: emily.id },
  });
  const green = await prisma.property.create({
    data: { name: "Green Valley Residences", address: "789 Valley Rd, Austin, TX 78701", managerId: emily.id },
  });

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

  // Ticket 1: COMPLETED - full lifecycle
  const t1 = await prisma.maintenanceTicket.create({
    data: {
      title: "Leaking Kitchen Faucet",
      description: "The kitchen faucet has been dripping constantly for the past two days. Water is pooling under the sink and the drip rate seems to be increasing. I've placed a bucket underneath but it fills up every few hours.",
      status: "COMPLETED",
      priority: "HIGH",
      category: "PLUMBING",
      unitNumber: "Apt 3A",
      propertyId: sunset.id,
      submitterId: sarah.id,
      assigneeId: john.id,
      createdAt: daysAgo(5),
      completedAt: daysAgo(1),
    },
  });
  await prisma.ticketActivityLog.createMany({
    data: [
      { ticketId: t1.id, performedBy: sarah.id, action: "CREATED", details: JSON.stringify({ title: t1.title }), createdAt: daysAgo(5) },
      { ticketId: t1.id, performedBy: emily.id, action: "ASSIGNED", details: JSON.stringify({ technicianName: "John Smith" }), createdAt: daysAgo(4) },
      { ticketId: t1.id, performedBy: john.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "ASSIGNED", to: "IN_PROGRESS" }), createdAt: daysAgo(3) },
      { ticketId: t1.id, performedBy: john.id, action: "COMMENTED", details: JSON.stringify({ preview: "Identified the issue - worn O-ring" }), createdAt: daysAgo(3) },
      { ticketId: t1.id, performedBy: john.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "IN_PROGRESS", to: "COMPLETED" }), createdAt: daysAgo(1) },
    ],
  });
  await prisma.ticketComment.createMany({
    data: [
      { ticketId: t1.id, authorId: john.id, content: "Identified the issue - worn O-ring on the faucet cartridge. Will need to replace it. I'll pick up the part and come back tomorrow.", createdAt: daysAgo(3) },
      { ticketId: t1.id, authorId: sarah.id, content: "Thanks John! I'll be home all day tomorrow. The front door code is 4521.", createdAt: daysAgo(3) },
      { ticketId: t1.id, authorId: john.id, content: "All fixed! Replaced the O-ring and tested - no more leaking. Also tightened the connection under the sink.", createdAt: daysAgo(1) },
    ],
  });

  // Ticket 2: IN_PROGRESS
  const t2 = await prisma.maintenanceTicket.create({
    data: {
      title: "Broken AC Unit in Bedroom",
      description: "The air conditioning unit in the master bedroom is not cooling. It turns on and the fan runs but only warm air comes out. Temperature has been 85°F inside despite setting it to 72°F.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      category: "HVAC",
      unitNumber: "Unit 12B",
      propertyId: harbor.id,
      submitterId: mike.id,
      assigneeId: lisa.id,
      createdAt: daysAgo(2),
    },
  });
  await prisma.ticketActivityLog.createMany({
    data: [
      { ticketId: t2.id, performedBy: mike.id, action: "CREATED", details: JSON.stringify({ title: t2.title }), createdAt: daysAgo(2) },
      { ticketId: t2.id, performedBy: emily.id, action: "ASSIGNED", details: JSON.stringify({ technicianName: "Lisa Martinez" }), createdAt: daysAgo(2) },
      { ticketId: t2.id, performedBy: lisa.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "ASSIGNED", to: "IN_PROGRESS" }), createdAt: daysAgo(1) },
    ],
  });
  await prisma.ticketComment.create({
    data: { ticketId: t2.id, authorId: lisa.id, content: "Checked the unit - looks like the compressor is failing. Need to order a replacement part. Should arrive in 2-3 days.", createdAt: daysAgo(1) },
  });

  // Ticket 3: ASSIGNED
  const t3 = await prisma.maintenanceTicket.create({
    data: {
      title: "Electrical Outlet Not Working",
      description: "The outlet in the living room near the TV stand has stopped working. I've checked the breaker and it seems fine. Other outlets in the room work normally.",
      status: "ASSIGNED",
      priority: "MEDIUM",
      category: "ELECTRICAL",
      unitNumber: "Apt 7C",
      propertyId: green.id,
      submitterId: raj.id,
      assigneeId: john.id,
      createdAt: daysAgo(1),
    },
  });
  await prisma.ticketActivityLog.createMany({
    data: [
      { ticketId: t3.id, performedBy: raj.id, action: "CREATED", details: JSON.stringify({ title: t3.title }), createdAt: daysAgo(1) },
      { ticketId: t3.id, performedBy: emily.id, action: "ASSIGNED", details: JSON.stringify({ technicianName: "John Smith" }), createdAt: hoursAgo(12) },
    ],
  });

  // Ticket 4: OPEN - fresh
  const t4 = await prisma.maintenanceTicket.create({
    data: {
      title: "Clogged Bathroom Drain",
      description: "The bathroom sink is draining very slowly. Water takes about 5 minutes to drain completely. I've tried using a plunger but it didn't help.",
      status: "OPEN",
      priority: "MEDIUM",
      category: "PLUMBING",
      unitNumber: "Apt 3A",
      propertyId: sunset.id,
      submitterId: sarah.id,
      createdAt: hoursAgo(1),
    },
  });
  await prisma.ticketActivityLog.create({
    data: { ticketId: t4.id, performedBy: sarah.id, action: "CREATED", details: JSON.stringify({ title: t4.title }), createdAt: hoursAgo(1) },
  });

  // Ticket 5: OPEN - urgent
  const t5 = await prisma.maintenanceTicket.create({
    data: {
      title: "Pest Issue - Ants in Kitchen",
      description: "Found a trail of ants coming from under the kitchen cabinet. They seem to be coming in from a crack in the wall near the window. The problem started about a week ago and is getting worse.",
      status: "OPEN",
      priority: "URGENT",
      category: "PEST_CONTROL",
      unitNumber: "Unit 5A",
      propertyId: harbor.id,
      submitterId: mike.id,
      createdAt: hoursAgo(0.5),
    },
  });
  await prisma.ticketActivityLog.create({
    data: { ticketId: t5.id, performedBy: mike.id, action: "CREATED", details: JSON.stringify({ title: t5.title }), createdAt: hoursAgo(0.5) },
  });

  // Ticket 6: IN_PROGRESS
  const t6 = await prisma.maintenanceTicket.create({
    data: {
      title: "Water Heater Making Strange Noise",
      description: "The water heater in the utility closet has been making a loud rumbling/banging noise, especially when hot water is being used. It started about 3 days ago.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      category: "HVAC",
      unitNumber: "Apt 2D",
      propertyId: green.id,
      submitterId: raj.id,
      assigneeId: lisa.id,
      createdAt: daysAgo(3),
    },
  });
  await prisma.ticketActivityLog.createMany({
    data: [
      { ticketId: t6.id, performedBy: raj.id, action: "CREATED", details: JSON.stringify({ title: t6.title }), createdAt: daysAgo(3) },
      { ticketId: t6.id, performedBy: emily.id, action: "ASSIGNED", details: JSON.stringify({ technicianName: "Lisa Martinez" }), createdAt: daysAgo(2) },
      { ticketId: t6.id, performedBy: lisa.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "ASSIGNED", to: "IN_PROGRESS" }), createdAt: daysAgo(1) },
    ],
  });
  await prisma.ticketComment.createMany({
    data: [
      { ticketId: t6.id, authorId: lisa.id, content: "Inspected the water heater. Sediment buildup at the bottom is causing the noise. Going to perform a flush.", createdAt: daysAgo(1) },
      { ticketId: t6.id, authorId: raj.id, content: "Thank you! Should I avoid using hot water while you work on it?", createdAt: daysAgo(1) },
    ],
  });

  // Ticket 7: COMPLETED
  const t7 = await prisma.maintenanceTicket.create({
    data: {
      title: "Cracked Window in Living Room",
      description: "There's a crack in the living room window, about 6 inches long. It looks like it might have been caused by a temperature change. Cold air is getting in.",
      status: "COMPLETED",
      priority: "HIGH",
      category: "STRUCTURAL",
      unitNumber: "Apt 3A",
      propertyId: sunset.id,
      submitterId: sarah.id,
      assigneeId: john.id,
      createdAt: daysAgo(10),
      completedAt: daysAgo(7),
    },
  });
  await prisma.ticketActivityLog.createMany({
    data: [
      { ticketId: t7.id, performedBy: sarah.id, action: "CREATED", details: JSON.stringify({ title: t7.title }), createdAt: daysAgo(10) },
      { ticketId: t7.id, performedBy: emily.id, action: "ASSIGNED", details: JSON.stringify({ technicianName: "John Smith" }), createdAt: daysAgo(9) },
      { ticketId: t7.id, performedBy: john.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "ASSIGNED", to: "IN_PROGRESS" }), createdAt: daysAgo(8) },
      { ticketId: t7.id, performedBy: john.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "IN_PROGRESS", to: "COMPLETED" }), createdAt: daysAgo(7) },
    ],
  });

  // Ticket 8: ASSIGNED
  const t8 = await prisma.maintenanceTicket.create({
    data: {
      title: "Dishwasher Not Draining",
      description: "The dishwasher fills with water but doesn't drain at the end of the cycle. There's standing water at the bottom after each wash.",
      status: "ASSIGNED",
      priority: "MEDIUM",
      category: "APPLIANCE",
      unitNumber: "Unit 9C",
      propertyId: harbor.id,
      submitterId: mike.id,
      assigneeId: john.id,
      createdAt: daysAgo(1),
    },
  });
  await prisma.ticketActivityLog.createMany({
    data: [
      { ticketId: t8.id, performedBy: mike.id, action: "CREATED", details: JSON.stringify({ title: t8.title }), createdAt: daysAgo(1) },
      { ticketId: t8.id, performedBy: emily.id, action: "ASSIGNED", details: JSON.stringify({ technicianName: "John Smith" }), createdAt: hoursAgo(6) },
    ],
  });

  // Ticket 9: OPEN - low priority
  const t9 = await prisma.maintenanceTicket.create({
    data: {
      title: "Light Fixture Flickering in Hallway",
      description: "The hallway light fixture has been flickering intermittently. It's not a bulb issue - I've already tried replacing it. Might be a wiring problem.",
      status: "OPEN",
      priority: "LOW",
      category: "ELECTRICAL",
      unitNumber: "Apt 7C",
      propertyId: green.id,
      submitterId: raj.id,
      createdAt: daysAgo(2),
    },
  });
  await prisma.ticketActivityLog.create({
    data: { ticketId: t9.id, performedBy: raj.id, action: "CREATED", details: JSON.stringify({ title: t9.title }), createdAt: daysAgo(2) },
  });

  // Ticket 10: COMPLETED - quick resolution
  const t10 = await prisma.maintenanceTicket.create({
    data: {
      title: "Front Door Lock is Stiff",
      description: "The front door lock has become very stiff and hard to turn. I'm worried it might get stuck completely.",
      status: "COMPLETED",
      priority: "MEDIUM",
      category: "OTHER",
      unitNumber: "Unit 5A",
      propertyId: harbor.id,
      submitterId: mike.id,
      assigneeId: john.id,
      createdAt: daysAgo(4),
      completedAt: daysAgo(3),
    },
  });
  await prisma.ticketActivityLog.createMany({
    data: [
      { ticketId: t10.id, performedBy: mike.id, action: "CREATED", details: JSON.stringify({ title: t10.title }), createdAt: daysAgo(4) },
      { ticketId: t10.id, performedBy: emily.id, action: "ASSIGNED", details: JSON.stringify({ technicianName: "John Smith" }), createdAt: daysAgo(4) },
      { ticketId: t10.id, performedBy: john.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "ASSIGNED", to: "IN_PROGRESS" }), createdAt: daysAgo(3) },
      { ticketId: t10.id, performedBy: john.id, action: "STATUS_CHANGED", details: JSON.stringify({ from: "IN_PROGRESS", to: "COMPLETED" }), createdAt: daysAgo(3) },
    ],
  });

  // Create notifications
  const notifications = [
    { userId: emily.id, title: "New Ticket Created", message: "Sarah Johnson submitted: Clogged Bathroom Drain", type: "TICKET_CREATED", linkUrl: `/tickets/${t4.id}`, isRead: false, createdAt: hoursAgo(1) },
    { userId: emily.id, title: "New Ticket Created", message: "Mike Chen submitted: Pest Issue - Ants in Kitchen", type: "TICKET_CREATED", linkUrl: `/tickets/${t5.id}`, isRead: false, createdAt: hoursAgo(0.5) },
    { userId: emily.id, title: "New Ticket Created", message: "Raj Patel submitted: Light Fixture Flickering in Hallway", type: "TICKET_CREATED", linkUrl: `/tickets/${t9.id}`, isRead: true, createdAt: daysAgo(2) },
    { userId: john.id, title: "Ticket Assigned", message: "You've been assigned: Electrical Outlet Not Working", type: "TICKET_ASSIGNED", linkUrl: `/tickets/${t3.id}`, isRead: false, createdAt: hoursAgo(12) },
    { userId: john.id, title: "Ticket Assigned", message: "You've been assigned: Dishwasher Not Draining", type: "TICKET_ASSIGNED", linkUrl: `/tickets/${t8.id}`, isRead: false, createdAt: hoursAgo(6) },
    { userId: lisa.id, title: "Ticket Assigned", message: "You've been assigned: Broken AC Unit in Bedroom", type: "TICKET_ASSIGNED", linkUrl: `/tickets/${t2.id}`, isRead: true, createdAt: daysAgo(2) },
    { userId: sarah.id, title: "Ticket Updated", message: 'Your ticket "Leaking Kitchen Faucet" is now COMPLETED', type: "STATUS_CHANGED", linkUrl: `/tickets/${t1.id}`, isRead: true, createdAt: daysAgo(1) },
    { userId: mike.id, title: "Ticket Updated", message: 'Your ticket "Front Door Lock is Stiff" is now COMPLETED', type: "STATUS_CHANGED", linkUrl: `/tickets/${t10.id}`, isRead: true, createdAt: daysAgo(3) },
    { userId: mike.id, title: "New Comment", message: 'Lisa Martinez commented on: Broken AC Unit in Bedroom', type: "COMMENT_ADDED", linkUrl: `/tickets/${t2.id}`, isRead: false, createdAt: daysAgo(1) },
    { userId: raj.id, title: "New Comment", message: 'Lisa Martinez commented on: Water Heater Making Strange Noise', type: "COMMENT_ADDED", linkUrl: `/tickets/${t6.id}`, isRead: false, createdAt: daysAgo(1) },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  console.log("Seed data created successfully!");
  console.log("");
  console.log("Demo accounts (all passwords: password123):");
  console.log("  Tenant:     sarah@demo.com");
  console.log("  Tenant:     mike@demo.com");
  console.log("  Tenant:     raj@demo.com");
  console.log("  Manager:    admin@demo.com");
  console.log("  Technician: john@demo.com");
  console.log("  Technician: lisa@demo.com");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
