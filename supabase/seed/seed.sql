-- ==============================================================================
-- SEDS REC PLATFORM: REALISTIC SEED DATA
-- Fictional members, teams, sprints, collaborative tasks, comments, and activity
-- ==============================================================================

-- 1. Insert Teams
INSERT INTO teams (id, name, description, icon, color, accent) VALUES
('11111111-1111-1111-1111-111111111101', 'Project Medersia', 'CanSat & High-Altitude Balloon payload development and orbital telemetry.', 'Satellite', '#6366f1', 'indigo'),
('11111111-1111-1111-1111-111111111102', 'Aerospace Systems', 'Rocket propulsion, supersonic aerodynamics, and structural airframe engineering.', 'Rocket', '#06b6d4', 'cyan'),
('11111111-1111-1111-1111-111111111103', 'Ground Station', 'UHF/VHF & S-band satellite tracking station, SDR pipelines, and link budget.', 'Radio', '#10b981', 'emerald'),
('11111111-1111-1111-1111-111111111104', 'Content & Media', 'Mission documentaries, scientific outreach media, graphics, and technical papers.', 'Video', '#f59e0b', 'amber'),
('11111111-1111-1111-1111-111111111105', 'Outreach & PR', 'STEM school workshops, space science conferences, and public outreach events.', 'Globe', '#ec4899', 'pink'),
('11111111-1111-1111-1111-111111111106', 'Technical & Avionics', 'Embedded flight computers, PCB layouts, power distribution, and firmware.', 'Cpu', '#8b5cf6', 'purple'),
('11111111-1111-1111-1111-111111111107', 'Events & Operations', 'Logistics, field testing site clearances, launch day coordination, and safety.', 'Calendar', '#3b82f6', 'blue')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Profiles
-- Note: When using Supabase Auth, profiles link to auth.users. 
-- In pure SQL test scripts, we populate the profiles table.
INSERT INTO profiles (id, full_name, email, avatar_url, role, team_id, title) VALUES
-- Office Bearers (Org-wide, team_id is NULL)
('22222222-2222-2222-2222-222222222201', 'Dr. Ananya Sharma', 'president@sedsrec.org', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'OFFICE_BEARER', NULL, 'SEDS REC President'),
('22222222-2222-2222-2222-222222222202', 'Rohan Iyer', 'vp@sedsrec.org', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'OFFICE_BEARER', NULL, 'Vice President'),

-- Project Medersia Team Leads (Two leads on one team as specified in requirements)
('22222222-2222-2222-2222-222222222203', 'Vikram Rao', 'vikram.rao@sedsrec.org', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'TEAM_LEAD', '11111111-1111-1111-1111-111111111101', 'Lead Propulsion & Systems'),
('22222222-2222-2222-2222-222222222204', 'Sneha Patel', 'sneha.patel@sedsrec.org', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 'TEAM_LEAD', '11111111-1111-1111-1111-111111111101', 'Co-Lead Payload Architecture'),

-- Project Medersia Team Members
('22222222-2222-2222-2222-222222222205', 'Arjun Kumar', 'arjun.k@sedsrec.org', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'TEAM_MEMBER', '11111111-1111-1111-1111-111111111101', 'Avionics & Telemetry Specialist'),
('22222222-2222-2222-2222-222222222206', 'Priya Nair', 'priya.n@sedsrec.org', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'TEAM_MEMBER', '11111111-1111-1111-1111-111111111101', 'Thermal Vacuum Analyst'),
('22222222-2222-2222-2222-222222222207', 'Siddharth Verma', 'siddharth.v@sedsrec.org', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 'TEAM_MEMBER', '11111111-1111-1111-1111-111111111101', 'Sensor Fusion Developer'),

-- Aerospace Systems Leads & Members
('22222222-2222-2222-2222-222222222208', 'Kabir Mehta', 'kabir.m@sedsrec.org', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'TEAM_LEAD', '11111111-1111-1111-1111-111111111102', 'Aerodynamics & CFD Lead'),
('22222222-2222-2222-2222-222222222209', 'Rithika Sen', 'rithika.s@sedsrec.org', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'TEAM_MEMBER', '11111111-1111-1111-1111-111111111102', 'Structural Airframe Engineer'),

-- Ground Station Lead & Members
('22222222-2222-2222-2222-222222222210', 'Divya Krishnan', 'divya.k@sedsrec.org', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80', 'TEAM_LEAD', '11111111-1111-1111-1111-111111111103', 'RF Communications Lead'),
('22222222-2222-2222-2222-222222222211', 'Karthik V', 'karthik.v@sedsrec.org', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'TEAM_MEMBER', '11111111-1111-1111-1111-111111111103', 'Antenna Tracking Engineer')
ON CONFLICT (id) DO NOTHING;

-- 3. Team Members relationships
INSERT INTO team_members (team_id, user_id, membership_role) VALUES
('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 'TEAM_LEAD'),
('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222204', 'TEAM_LEAD'),
('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222205', 'TEAM_MEMBER'),
('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222206', 'TEAM_MEMBER'),
('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222207', 'TEAM_MEMBER'),
('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222208', 'TEAM_LEAD'),
('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222209', 'TEAM_MEMBER'),
('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222210', 'TEAM_LEAD'),
('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222211', 'TEAM_MEMBER')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Sprints
INSERT INTO sprints (id, team_id, name, goal, description, start_date, end_date, status, created_by) VALUES
('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'Sprint 04', 'Ground station integration & live telemetry dashboard', 'Achieve flight readiness for telemetry stream, pass environmental thermal tests, and link with ground station SDR.', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', 'ACTIVE', '22222222-2222-2222-2222-222222222203'),
('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', 'Sprint 03', 'Attitude Determination & Sensor Fusion Architecture', 'Completed sensor fusion benchmarks with Extended Kalman Filter and verified 6-DOF test bench logs.', CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE - INTERVAL '7 days', 'COMPLETED', '22222222-2222-2222-2222-222222222203'),
('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111102', 'Sprint 02', 'Transonic Fin Flutter & Carbon Honeycomb Optimization', 'Simulate transonic shock drag on stabilizing fins and execute structural destructive load tests.', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 'ACTIVE', '22222222-2222-2222-2222-222222222208'),
('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111103', 'Sprint 03', 'S-Band Transceiver Link Budget & Tracking Rotor', 'Calibrate automated rotor pedestal tracking for low-earth orbit passes and optimize LNA noise figure.', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', 'ACTIVE', '22222222-2222-2222-2222-222222222210')
ON CONFLICT (id) DO NOTHING;

-- 5. Tasks
INSERT INTO tasks (id, team_id, sprint_id, title, description, status, priority, due_date, story_points, created_by) VALUES
-- Medersia Tasks
('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'Build telemetry dashboard', 'Build high-performance real-time UI showing altitude, Euler angles, GPS lock, barometric pressure, and packet drop rate.', 'IN_PROGRESS', 'HIGH', CURRENT_DATE + INTERVAL '2 days', 8, '22222222-2222-2222-2222-222222222203'),
('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'Integrate SDR UDP stream with WebSocket server', 'Implement demodulated bitstream decoder from HackRF One SDR into JSON telemetry frames over low-latency WebSockets.', 'TODO', 'URGENT', CURRENT_DATE + INTERVAL '1 day', 5, '22222222-2222-2222-2222-222222222203'),
('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'Perform transient thermal vacuum finite element analysis', 'Simulate radiative heating in -40C to +85C temperature cycles using Ansys SpaceClaim thermal boundary conditions.', 'IN_REVIEW', 'HIGH', CURRENT_DATE + INTERVAL '4 days', 5, '22222222-2222-2222-2222-222222222204'),
('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'Calibrate IMU sensor drift with Kalman Filter', 'Eliminate gyro integration drift on 9-DOF BNO085 IMU using magnetic anomaly rejection filter.', 'COMPLETED', 'MEDIUM', CURRENT_DATE - INTERVAL '1 day', 3, '22222222-2222-2222-2222-222222222203'),
('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'Power distribution unit overcurrent protection latch', 'Hardware latching current limiter tripping unexpectedly during 3.3V rail transient spikes. Needs damping resistor.', 'BLOCKED', 'URGENT', CURRENT_DATE + INTERVAL '3 days', 5, '22222222-2222-2222-2222-222222222204'),
-- Backlog Tasks
('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111101', NULL, 'High-gain helical antenna deployment mechanism', 'Design spring-loaded Nichrome wire burn wire release mechanism for payload casing.', 'BACKLOG', 'LOW', NULL, 3, '22222222-2222-2222-2222-222222222203'),
('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111101', NULL, 'Radiation hardening testing protocol documentation', 'Draft testing standards for total ionizing dose (TID) radiation testing at collaborator lab.', 'BACKLOG', 'MEDIUM', NULL, 2, '22222222-2222-2222-2222-222222222204'),

-- Aerospace Tasks
('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333303', 'CFD Mach 1.4 aerodynamic shockwave simulation', 'Perform supersonic compressible flow simulation on nose cone tip geometry using OpenFOAM.', 'IN_PROGRESS', 'HIGH', CURRENT_DATE + INTERVAL '5 days', 8, '22222222-2222-2222-2222-222222222208'),
('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333303', 'Carbon fiber composite lay-up shear strength testing', 'Fabricate 4-layer epoxy pre-preg test coupons and measure shear modulus on tensile test rig.', 'COMPLETED', 'MEDIUM', CURRENT_DATE - INTERVAL '2 days', 5, '22222222-2222-2222-2222-222222222208'),

-- Ground Station Tasks
('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333304', 'Automatic azimuth-elevation rotor tracking calibration', 'Calibrate Yaesu G-5500 rotator controller feedback loop with ephemeris TLE orbital pass predictions.', 'IN_PROGRESS', 'HIGH', CURRENT_DATE + INTERVAL '3 days', 5, '22222222-2222-2222-2222-222222222210'),
('44444444-4444-4444-4444-444444444411', '11111111-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333304', 'LNA signal-to-noise ratio benchmark testing', 'Measure noise figure at 436.5 MHz with spectrum analyzer; awaiting replacement SMA attenuator pad.', 'BLOCKED', 'HIGH', CURRENT_DATE + INTERVAL '1 day', 3, '22222222-2222-2222-2222-222222222210')
ON CONFLICT (id) DO NOTHING;

-- 6. Task Assignees (Collaborative Tasks Demonstration)
-- Task 1 "Build telemetry dashboard" assigned to Arjun, Siddharth, Priya (3 members!)
INSERT INTO task_assignees (task_id, user_id, assigned_by) VALUES
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222205', '22222222-2222-2222-2222-222222222203'), -- Arjun
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222207', '22222222-2222-2222-2222-222222222203'), -- Siddharth
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222206', '22222222-2222-2222-2222-222222222203'), -- Priya

-- Task 2 assigned to Arjun
('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222205', '22222222-2222-2222-2222-222222222203'),

-- Task 3 assigned to Priya
('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222206', '22222222-2222-2222-2222-222222222204'),

-- Task 4 assigned to Siddharth
('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222207', '22222222-2222-2222-2222-222222222203'),

-- Task 5 assigned to Arjun & Priya (Collaborative blocked task)
('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222205', '22222222-2222-2222-2222-222222222204'),
('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222206', '22222222-2222-2222-2222-222222222204'),

-- Aerospace Tasks assigned to Rithika
('44444444-4444-4444-4444-444444444408', '22222222-2222-2222-2222-222222222209', '22222222-2222-2222-2222-222222222208'),
('44444444-4444-4444-4444-444444444409', '22222222-2222-2222-2222-222222222209', '22222222-2222-2222-2222-222222222208'),

-- Ground Station Tasks assigned to Karthik
('44444444-4444-4444-4444-444444444410', '22222222-2222-2222-2222-222222222211', '22222222-2222-2222-2222-222222222210'),
('44444444-4444-4444-4444-444444444411', '22222222-2222-2222-2222-222222222211', '22222222-2222-2222-2222-222222222210')
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 7. Comments
INSERT INTO comments (task_id, author_id, content, created_at) VALUES
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222205', 'Set up the WebSocket subscription handler. Real-time updates rendering at 60 FPS on 100Hz mock feed.', CURRENT_DATE - INTERVAL '2 days'),
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222207', 'Added the 3D attitude gyro model widget using Three.js / WebGL. Calibrated pitch & roll offsets.', CURRENT_DATE - INTERVAL '1 day'),
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222203', 'Excellent progress. Let us make sure packet drop counters trigger visual warning thresholds.', CURRENT_DATE - INTERVAL '4 hours'),
('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222205', 'Transient current spike occurs when the radio amplifier boots. Sourced a 100uF tantalum cap to test damping.', CURRENT_DATE - INTERVAL '1 day');

-- 8. Announcements
INSERT INTO announcements (id, team_id, created_by, title, content, priority, created_at) VALUES
('55555555-5555-5555-5555-555555555501', NULL, '22222222-2222-2222-2222-222222222201', 'Q3 Flight Readiness Review Scheduled', 'All team leads must submit their sprint deliverables and bill of materials before the national aerospace review next Friday. Critical milestones will be evaluated by ISRO guest scientists.', 'URGENT', CURRENT_DATE - INTERVAL '3 days'),
('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 'Project Medersia Lab Testing Window', 'Cleanroom and thermal test chamber booked for Tuesday 14:00 - 18:00 IST. Please prepare all payload housings.', 'NORMAL', CURRENT_DATE - INTERVAL '1 day');

-- 9. Activity Logs
INSERT INTO activity_logs (actor_id, team_id, task_id, sprint_id, action, metadata, created_at) VALUES
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'task_created', '{"title": "Build telemetry dashboard", "points": 8}'::jsonb, CURRENT_DATE - INTERVAL '5 days'),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'task_assigned', '{"assignees": ["Arjun Kumar", "Siddharth Verma", "Priya Nair"]}'::jsonb, CURRENT_DATE - INTERVAL '5 days'),
('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111101', '44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333301', 'task_completed', '{"title": "Calibrate IMU sensor drift with Kalman Filter"}'::jsonb, CURRENT_DATE - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', NULL, '33333333-3333-3333-3333-333333333301', 'sprint_started', '{"name": "Sprint 04"}'::jsonb, CURRENT_DATE - INTERVAL '6 days');

-- 10. Notifications
INSERT INTO notifications (user_id, title, message, type, link, read) VALUES
('22222222-2222-2222-2222-222222222205', 'Assigned to collaborative task', 'Vikram Rao assigned you to "Build telemetry dashboard" along with Siddharth and Priya.', 'task_assigned', '/tasks/44444444-4444-4444-4444-444444444401', false),
('22222222-2222-2222-2222-222222222205', 'Task Blocked: PDU Latch', 'Power distribution unit overcurrent protection latch marked BLOCKED.', 'task_status_changed', '/tasks/44444444-4444-4444-4444-444444444405', false),
('22222222-2222-2222-2222-222222222205', 'New Org Announcement', 'Dr. Ananya Sharma published: Q3 Flight Readiness Review Scheduled', 'announcement', '/announcements', false);
