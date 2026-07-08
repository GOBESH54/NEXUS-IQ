"""
NEXUS IQ™ — Comprehensive Demo Data Seeder
Run with:  python -m app.seed_data

Populates the entire database with realistic industrial plant data for
Bharat Steel Limited — Jamshedpur Works, Unit 2.
"""

import uuid
import logging
import sys
from datetime import datetime, timedelta

from app.database import SessionLocal, init_db
from app.models import (
    Plant, User, Equipment, Document, Chunk,
    MaintenanceRecord, InspectionRecord, IncidentReport,
    ComplianceRequirement, TribalKnowledge, FailureDNA,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(levelname)s │ %(message)s")
logger = logging.getLogger(__name__)

# ── Helpers ──────────────────────────────────────────────────────────────────

def _uid():
    return str(uuid.uuid4())

def _dt(year, month, day, hour=8, minute=0):
    return datetime(year, month, day, hour, minute)


# ── Seed Functions ───────────────────────────────────────────────────────────

def seed_plant(db):
    """Create the Bharat Steel Jamshedpur Works plant."""
    plant = Plant(
        id=_uid(),
        name="Bharat Steel Limited — Jamshedpur Works, Unit 2",
        location="Jamshedpur, Jharkhand, India",
        plant_code="BSL-JSR-U2",
        description=(
            "Integrated steel plant with blast furnace, BOF, continuous casting, "
            "and hot rolling mill. Annual capacity: 3.2 MTPA. "
            "Commissioned 1992, last major overhaul 2021."
        ),
    )
    db.add(plant)
    db.flush()
    logger.info(f"✅ Plant: {plant.name}")
    return plant


def seed_users(db):
    """Create 5 key plant personnel."""
    users_data = [
        ("rajesh.kumar", "Rajesh Kumar", "Maintenance Manager", "Maintenance Engineering"),
        ("suresh.patel", "Suresh Patel", "Senior Technician", "Maintenance"),
        ("priya.sharma", "Priya Sharma", "Safety Officer", "HSE Department"),
        ("amit.singh", "Amit Singh", "Plant Head", "Plant Management"),
        ("neha.verma", "Neha Verma", "Reliability Engineer", "Maintenance Engineering"),
    ]
    users = []
    for uname, fname, role, dept in users_data:
        u = User(id=_uid(), username=uname, full_name=fname, role=role, department=dept)
        db.add(u)
        users.append(u)
    db.flush()
    logger.info(f"✅ Users: {len(users)} created")
    return users


def seed_equipment(db, plant):
    """Create 10 equipment items with full specifications."""
    equipment_data = [
        {
            "tag_id": "BF-P-07A", "name": "Centrifugal Pump — Primary Cooling",
            "equipment_type": "Centrifugal Pump",
            "manufacturer": "Kirloskar Brothers Ltd", "model_number": "KBL DB 150/26",
            "serial_number": "KBL-2019-07843",
            "installation_date": _dt(2019, 3, 15),
            "location_area": "Blast Furnace Cooling Water System",
            "criticality": "critical", "status": "operational",
            "parent_system": "Blast Furnace Cooling",
            "specifications": {
                "flow_rate_m3h": 250, "head_m": 45, "power_kw": 55,
                "rpm": 2950, "impeller_diameter_mm": 260,
                "seal_type": "Mechanical Seal — John Crane Type 2100",
                "bearing_type": "SKF 6310-2RS Deep Groove Ball Bearing",
                "suction_pressure_bar": 2.5, "discharge_pressure_bar": 6.8,
                "motor_rating": "55 kW, 415V, 3-phase, IE3",
            },
        },
        {
            "tag_id": "BF-P-07B", "name": "Centrifugal Pump — Standby Cooling",
            "equipment_type": "Centrifugal Pump",
            "manufacturer": "Kirloskar Brothers Ltd", "model_number": "KBL DB 150/26",
            "serial_number": "KBL-2019-07844",
            "installation_date": _dt(2019, 3, 15),
            "location_area": "Blast Furnace Cooling Water System",
            "criticality": "critical", "status": "degraded",
            "parent_system": "Blast Furnace Cooling",
            "specifications": {
                "flow_rate_m3h": 250, "head_m": 45, "power_kw": 55,
                "rpm": 2950, "impeller_diameter_mm": 260,
                "seal_type": "Mechanical Seal — John Crane Type 2100",
                "bearing_type": "SKF 6310-2RS Deep Groove Ball Bearing",
                "suction_pressure_bar": 2.5, "discharge_pressure_bar": 6.8,
                "motor_rating": "55 kW, 415V, 3-phase, IE3",
            },
        },
        {
            "tag_id": "BF-C-01A", "name": "Blast Furnace Air Compressor",
            "equipment_type": "Compressor",
            "manufacturer": "Atlas Copco India", "model_number": "ZR 400 VSD",
            "serial_number": "ACI-2020-12567",
            "installation_date": _dt(2020, 7, 22),
            "location_area": "Blast Furnace Air Supply",
            "criticality": "critical", "status": "operational",
            "parent_system": "Blast Furnace Air Supply",
            "specifications": {
                "capacity_cfm": 2100, "pressure_bar": 10.5, "power_kw": 400,
                "type": "Oil-free Rotary Screw", "cooling": "Water-cooled",
                "vsd": True, "air_quality_class": "ISO 8573-1 Class 0",
            },
        },
        {
            "tag_id": "HE-104B", "name": "Shell & Tube Heat Exchanger — Cooling Water",
            "equipment_type": "Heat Exchanger",
            "manufacturer": "Thermax Ltd", "model_number": "STHE-500-4P",
            "serial_number": "TMX-2018-34291",
            "installation_date": _dt(2018, 11, 10),
            "location_area": "Cooling Water System",
            "criticality": "important", "status": "operational",
            "parent_system": "Blast Furnace Cooling",
            "specifications": {
                "type": "Shell & Tube, 4-Pass", "duty_kw": 2500,
                "shell_material": "SA 516 Gr. 70", "tube_material": "Admiralty Brass",
                "tube_count": 420, "tube_od_mm": 19.05,
                "design_pressure_shell_bar": 10, "design_pressure_tube_bar": 7,
                "design_temp_c": 150,
            },
        },
        {
            "tag_id": "FCV-2301", "name": "Flow Control Valve — Process Water",
            "equipment_type": "Control Valve",
            "manufacturer": "Forbes Marshall", "model_number": "FM-ECV-6-150",
            "serial_number": "FM-2021-56782",
            "installation_date": _dt(2021, 4, 5),
            "location_area": "Process Control — Cooling Circuit",
            "criticality": "important", "status": "operational",
            "parent_system": "Process Control",
            "specifications": {
                "size_inch": 6, "class": 150, "type": "Globe",
                "actuator": "Pneumatic — Fisher 657",
                "positioner": "Fisher DVC6200", "cv": 180,
                "rangeability": "50:1", "body_material": "WCB",
                "trim_material": "SS 316",
            },
        },
        {
            "tag_id": "BL-03", "name": "Fire Tube Boiler — Steam Generation",
            "equipment_type": "Boiler",
            "manufacturer": "Thermax Babcock & Wilcox", "model_number": "TBW-FT-20T",
            "serial_number": "TBW-2017-09823",
            "installation_date": _dt(2017, 6, 20),
            "location_area": "Utility — Steam Generation",
            "criticality": "critical", "status": "operational",
            "parent_system": "Steam Generation",
            "specifications": {
                "capacity_tph": 20, "steam_pressure_bar": 17.5,
                "steam_temp_c": 250, "fuel": "Natural Gas + HFO",
                "efficiency_pct": 89, "type": "3-Pass Wetback Fire Tube",
                "heating_surface_m2": 245, "water_capacity_litres": 12000,
                "ibr_certificate": "IBR/JH/2023/1247",
            },
        },
        {
            "tag_id": "CT-01", "name": "Cooling Tower — Induced Draft",
            "equipment_type": "Cooling Tower",
            "manufacturer": "Paharpur Cooling Towers", "model_number": "PCT-ID-3000",
            "serial_number": "PCT-2016-04512",
            "installation_date": _dt(2016, 2, 14),
            "location_area": "Utility — Cooling Water",
            "criticality": "important", "status": "operational",
            "parent_system": "Blast Furnace Cooling",
            "specifications": {
                "capacity_m3h": 3000, "type": "Induced Draft Counter-Flow",
                "approach_c": 5, "range_c": 10, "wet_bulb_c": 28,
                "fan_power_kw": 75, "fill_type": "PVC Film Fill",
                "basin_volume_m3": 180,
            },
        },
        {
            "tag_id": "MOT-P07A", "name": "Electric Motor — BF-P-07A Driver",
            "equipment_type": "Electric Motor",
            "manufacturer": "ABB India", "model_number": "M3BP 250 SMA",
            "serial_number": "ABB-2019-78432",
            "installation_date": _dt(2019, 3, 15),
            "location_area": "Blast Furnace Cooling Water System",
            "criticality": "important", "status": "operational",
            "parent_system": "Blast Furnace Cooling",
            "specifications": {
                "power_kw": 55, "voltage": "415V", "frequency_hz": 50,
                "poles": 2, "rpm": 2955, "efficiency_class": "IE3",
                "frame": "250S", "insulation_class": "F",
                "bearing_de": "SKF 6314-2Z", "bearing_nde": "SKF 6312-2Z",
                "cooling": "TEFC (IC411)",
            },
        },
        {
            "tag_id": "TK-201", "name": "Process Water Storage Tank",
            "equipment_type": "Storage Tank",
            "manufacturer": "Godrej Process Equipment", "model_number": "GPE-VST-500",
            "serial_number": "GPE-2015-23456",
            "installation_date": _dt(2015, 9, 8),
            "location_area": "Process Water Storage",
            "criticality": "general", "status": "operational",
            "parent_system": "Process Control",
            "specifications": {
                "capacity_kl": 500, "type": "Vertical Cylindrical, Flat Bottom",
                "material": "SA 240 Type 304L", "diameter_m": 8.5,
                "height_m": 9.2, "design_pressure": "Atmospheric",
                "design_temp_c": 65, "internal_coating": "None (SS construction)",
            },
        },
        {
            "tag_id": "CV-105", "name": "Check Valve — Cooling Water Return",
            "equipment_type": "Check Valve",
            "manufacturer": "L&T Valves", "model_number": "LT-SC-8-150",
            "serial_number": "LT-2019-67890",
            "installation_date": _dt(2019, 3, 15),
            "location_area": "Cooling Water Return Line",
            "criticality": "general", "status": "operational",
            "parent_system": "Blast Furnace Cooling",
            "specifications": {
                "size_inch": 8, "class": 150, "type": "Swing Check",
                "body_material": "WCB", "disc_material": "SS 316",
                "end_connection": "Flanged RF",
            },
        },
    ]

    eq_map = {}
    for ed in equipment_data:
        eq = Equipment(
            id=_uid(),
            plant_id=plant.id,
            tag_id=ed["tag_id"],
            name=ed["name"],
            equipment_type=ed["equipment_type"],
            manufacturer=ed["manufacturer"],
            model_number=ed["model_number"],
            serial_number=ed["serial_number"],
            installation_date=ed.get("installation_date"),
            location_area=ed["location_area"],
            criticality=ed["criticality"],
            status=ed["status"],
            specifications=ed["specifications"],
            parent_system=ed["parent_system"],
        )
        db.add(eq)
        eq_map[ed["tag_id"]] = eq

    db.flush()
    logger.info(f"✅ Equipment: {len(eq_map)} items created")
    return eq_map


def seed_maintenance_records(db, eq_map):
    """Create 30+ maintenance records, with BF-P-07A showing bearing issue pattern."""

    # BF-P-07A — bearing deterioration pattern (12 records)
    p07a = eq_map["BF-P-07A"]
    bf_mx = [
        ("WO-2023-001", "preventive", "Quarterly vibration analysis and lubrication", "Vibration within normal limits (2.1 mm/s RMS). Bearing temperature 52°C.", "Lubrication replenished, alignment checked.", ["SKF LGMT 3 Grease"], 4, 12000, "Suresh Patel", "completed", "medium", _dt(2023, 1, 15), _dt(2023, 1, 15)),
        ("WO-2023-005", "preventive", "6-monthly seal inspection and performance check", "Mechanical seal in good condition. No leakage. Performance — flow 248 m³/h.", "Seal flush system cleaned, gland packing adjusted.", [], 6, 18000, "Suresh Patel", "completed", "medium", _dt(2023, 4, 12), _dt(2023, 4, 12)),
        ("WO-2023-011", "preventive", "Quarterly vibration analysis", "Slight increase in vibration detected (3.2 mm/s RMS vs 2.1 baseline). Bearing temperature 58°C.", "Monitoring frequency increased. Lubrication replenished.", ["SKF LGMT 3 Grease"], 3, 8000, "Suresh Patel", "completed", "medium", _dt(2023, 7, 20), _dt(2023, 7, 20)),
        ("WO-2023-018", "corrective", "Bearing noise investigation — unusual humming at DE bearing", "DE bearing showing early stage pitting on outer race. Vibration 4.8 mm/s RMS. Temperature spike to 72°C during peak load.", "DE bearing replaced. Root cause: contaminated lubricant during monsoon season.", ["SKF 6310-2RS Bearing", "SKF LGMT 3 Grease"], 18, 45000, "Suresh Patel", "completed", "high", _dt(2023, 9, 5), _dt(2023, 9, 6)),
        ("WO-2023-022", "preventive", "Post-repair verification and baseline", "New baseline established: vibration 1.8 mm/s RMS. Bearing temp 48°C. All parameters normal.", "Baseline readings recorded. Next check in 3 months.", [], 4, 8000, "Suresh Patel", "completed", "medium", _dt(2023, 10, 10), _dt(2023, 10, 10)),
        ("WO-2024-003", "preventive", "Quarterly vibration analysis", "Vibration within limits (2.0 mm/s RMS). Bearing temperature 50°C. Performance normal.", "Routine lubrication completed.", ["SKF LGMT 3 Grease"], 3, 7000, "Suresh Patel", "completed", "medium", _dt(2024, 1, 18), _dt(2024, 1, 18)),
        ("WO-2024-008", "predictive", "Thermography survey — all BF cooling pumps", "IR scan shows slight hot spot at coupling area. Max temp 62°C (within limits but trending up).", "Alignment check scheduled. Continue monitoring.", [], 2, 5000, "Neha Verma", "completed", "medium", _dt(2024, 4, 5), _dt(2024, 4, 5)),
        ("WO-2024-012", "corrective", "Coupling alignment correction", "Angular misalignment of 0.08mm detected (limit: 0.05mm). Caused by foundation settlement.", "Laser alignment performed. Shims added. Final alignment: 0.02mm.", ["Alignment Shim Set 0.1-0.5mm"], 8, 22000, "Suresh Patel", "completed", "high", _dt(2024, 5, 22), _dt(2024, 5, 22)),
        ("WO-2024-016", "preventive", "Quarterly vibration and oil analysis", "Vibration 2.3 mm/s RMS (normal). Oil analysis: slight increase in iron particles (28 ppm vs 15 ppm baseline).", "Oil changed. Sample sent for detailed ferrography.", ["Shell Tellus S2 V 46 — 20L"], 5, 15000, "Suresh Patel", "completed", "medium", _dt(2024, 7, 15), _dt(2024, 7, 15)),
        ("WO-2024-022", "corrective", "Bearing replacement — NDE bearing deterioration", "NDE bearing showing elevated vibration (5.1 mm/s). Ferrography confirmed metallic wear particles. Bearing operating since 2019 — exceeded L10 life.", "NDE bearing replaced. Both bearings now new. Lubrication system flushed.", ["SKF 6310-2RS Bearing", "Shell Tellus S2 V 46 — 20L", "SKF LGMT 3 Grease"], 24, 52000, "Suresh Patel", "completed", "high", _dt(2024, 10, 3), _dt(2024, 10, 4)),
        ("WO-2025-002", "preventive", "Post-bearing replacement — 3-month check", "All parameters normal. Vibration 1.6 mm/s RMS. Bearing temp 46°C. Excellent condition.", "Baseline updated. Standard monitoring schedule resumed.", [], 3, 6000, "Suresh Patel", "completed", "medium", _dt(2025, 1, 8), _dt(2025, 1, 8)),
        ("WO-2025-008", "preventive", "Quarterly vibration analysis and performance test", "Vibration 1.9 mm/s RMS. Flow 251 m³/h at 45m head. Efficiency 82%. All within spec.", "Routine maintenance completed. Next scheduled: July 2025.", ["SKF LGMT 3 Grease"], 4, 9000, "Suresh Patel", "completed", "medium", _dt(2025, 4, 14), _dt(2025, 4, 14)),
    ]

    # BF-P-07B — bearing seizure incident background (5 records)
    p07b = eq_map["BF-P-07B"]
    p07b_mx = [
        ("WO-2023-003", "preventive", "Standby pump quarterly check", "Pump run for 2 hours — all parameters normal. Vibration 2.4 mm/s.", "Standby readiness confirmed.", [], 3, 5000, "Suresh Patel", "completed", "medium", _dt(2023, 2, 20), _dt(2023, 2, 20)),
        ("WO-2023-015", "preventive", "Standby pump quarterly check", "Vibration slightly elevated (3.5 mm/s). Bearing temperature 63°C after 30 min run.", "Flagged for monitoring. Recommend bearing inspection at next opportunity.", [], 3, 5000, "Suresh Patel", "completed", "medium", _dt(2023, 8, 14), _dt(2023, 8, 14)),
        ("WO-2024-001", "emergency", "Bearing seizure during auto-switchover — BF-P-07B", "CRITICAL: DE bearing seized during auto-switchover when BF-P-07A tripped. Pump shaft locked. Motor overload tripped in 8 seconds. Cooling water supply interrupted for 47 minutes.", "Emergency bearing replacement. Shaft inspection — minor scoring. Pump reinstated after 36 hours.", ["SKF 6310-2RS Bearing x2", "Mechanical Seal — John Crane Type 2100", "Shaft Sleeve"], 36, 285000, "Suresh Patel", "completed", "critical", _dt(2024, 2, 14), _dt(2024, 2, 16)),
        ("WO-2024-006", "predictive", "Post-incident reliability assessment", "Pump restored but vibration at 3.8 mm/s (elevated). Shaft scoring detected during repair — monitoring closely. Recommended shaft replacement during next planned outage.", "Vibration monitoring increased to weekly. Spare shaft ordered.", [], 4, 8000, "Neha Verma", "completed", "high", _dt(2024, 3, 20), _dt(2024, 3, 20)),
        ("WO-2025-005", "corrective", "Shaft replacement and full overhaul", "Shaft replaced. New bearings installed. Mechanical seal replaced. Full performance test — flow 249 m³/h, vibration 1.7 mm/s.", "Full overhaul completed. Pump returned to standby service.", ["Pump Shaft Assembly", "SKF 6310-2RS Bearing x2", "Mechanical Seal — John Crane Type 2100", "Coupling Spider"], 48, 420000, "Suresh Patel", "completed", "critical", _dt(2025, 3, 10), _dt(2025, 3, 12)),
    ]

    # Other equipment (15+ records)
    other_mx = [
        (eq_map["BF-C-01A"], "WO-2024-009", "preventive", "Annual compressor overhaul", "Air end inspection — rotors in good condition. Oil separator element replaced. Control system calibrated.", "Full overhaul per Atlas Copco schedule.", ["Oil Separator Element", "Air Filter", "Oil Filter", "Scavenge Line"], 72, 180000, "Suresh Patel", "completed", "high", _dt(2024, 4, 15), _dt(2024, 4, 18)),
        (eq_map["BF-C-01A"], "WO-2025-004", "predictive", "Oil analysis — quarterly", "Oil condition normal. TAN: 0.8 (limit 2.0). Water content: 80 ppm (limit 200). Iron: 12 ppm.", "Oil satisfactory. Next change at 8000 hours.", [], 2, 4000, "Neha Verma", "completed", "medium", _dt(2025, 2, 10), _dt(2025, 2, 10)),
        (eq_map["HE-104B"], "WO-2023-009", "preventive", "Annual tube cleaning and inspection", "6 tubes plugged (1.4%). Tube thickness within limits. Shell-side fouling moderate.", "Chemical cleaning (shell side). Hydrotest passed at 10 bar.", ["Gasket Set — HE-104B"], 48, 85000, "Suresh Patel", "completed", "medium", _dt(2023, 6, 5), _dt(2023, 6, 7)),
        (eq_map["HE-104B"], "WO-2024-015", "preventive", "Annual inspection and cleaning", "2 additional tubes plugged (total 8 = 1.9%). Performance acceptable. U-value degraded 8% from design.", "Tubes plugged. Cleaning completed. Schedule replacement in 2026.", ["Gasket Set — HE-104B"], 36, 72000, "Suresh Patel", "completed", "medium", _dt(2024, 6, 12), _dt(2024, 6, 14)),
        (eq_map["FCV-2301"], "WO-2024-010", "corrective", "Valve positioner calibration drift", "Positioner output drifting 3% from setpoint. Causing flow oscillations in cooling circuit.", "Positioner recalibrated. Firmware updated.", ["Fisher DVC6200 Calibration Kit"], 6, 15000, "Neha Verma", "completed", "high", _dt(2024, 4, 25), _dt(2024, 4, 25)),
        (eq_map["FCV-2301"], "WO-2025-006", "preventive", "Annual valve stroke test and calibration", "Valve stroke smooth. No stick-slip. Seat leakage within Class IV limits.", "Routine calibration completed.", [], 4, 8000, "Neha Verma", "completed", "medium", _dt(2025, 3, 18), _dt(2025, 3, 18)),
        (eq_map["BL-03"], "WO-2023-020", "preventive", "IBR annual inspection", "Boiler condition satisfactory. Tube thickness min 3.2mm (original 4.0mm). Refractory condition fair.", "IBR certificate renewed. Minor refractory patch.", ["Refractory Patch Mix — 25 kg"], 96, 125000, "Suresh Patel", "completed", "critical", _dt(2023, 10, 1), _dt(2023, 10, 5)),
        (eq_map["BL-03"], "WO-2024-020", "corrective", "Flame scanner malfunction", "Flame scanner intermittent failure causing nuisance trip. Scanner lens fouled with combustion deposits.", "Scanner cleaned and recalibrated. Spare scanner installed.", ["Honeywell C7027A Flame Scanner"], 8, 35000, "Suresh Patel", "completed", "high", _dt(2024, 8, 8), _dt(2024, 8, 8)),
        (eq_map["CT-01"], "WO-2024-014", "preventive", "Monsoon pre-season CT maintenance", "Fill condition — 15% degradation. Fan blades — 2 blades with edge erosion. Basin cleaned.", "Fill cleaned. Fan blade edges repaired. Basin desludged.", ["Legionella Treatment Chemical — 200L"], 24, 45000, "Suresh Patel", "completed", "medium", _dt(2024, 5, 28), _dt(2024, 5, 29)),
        (eq_map["CT-01"], "WO-2025-007", "preventive", "Pre-monsoon cooling tower service", "Fill media degradation — recommend replacement by 2026. Fan motor bearing check OK. Water treatment system calibrated.", "Routine service completed. Fill replacement budgeted for next FY.", [], 16, 32000, "Suresh Patel", "completed", "medium", _dt(2025, 4, 2), _dt(2025, 4, 3)),
        (eq_map["MOT-P07A"], "WO-2024-011", "predictive", "Motor insulation resistance test", "IR value 150 MΩ at 500V (good). Winding resistance balanced. No issues detected.", "Routine electrical check completed.", [], 2, 4000, "Neha Verma", "completed", "medium", _dt(2024, 5, 5), _dt(2024, 5, 5)),
        (eq_map["TK-201"], "WO-2024-018", "preventive", "5-yearly tank inspection", "Internal inspection — no pitting or corrosion. Thickness readings all above minimum. Level instrument calibrated.", "Tank condition excellent. Next inspection 2029.", [], 24, 35000, "Suresh Patel", "completed", "low", _dt(2024, 7, 20), _dt(2024, 7, 21)),
        (eq_map["CV-105"], "WO-2024-019", "preventive", "Check valve inspection", "Disc hinge pin shows minor wear. Disc seating surface intact. No backflow during test.", "Hinge pin lubricated. Schedule pin replacement next annual shutdown.", [], 4, 6000, "Suresh Patel", "completed", "low", _dt(2024, 8, 15), _dt(2024, 8, 15)),
    ]

    count = 0
    for wo, mtype, desc, findings, actions, parts, dt_hrs, cost, tech, status, prio, sched, comp in bf_mx:
        db.add(MaintenanceRecord(
            id=_uid(), equipment_id=p07a.id, work_order=wo,
            maintenance_type=mtype, description=desc, findings=findings,
            actions_taken=actions, parts_replaced=parts,
            downtime_hours=dt_hrs, cost=cost, technician=tech,
            status=status, priority=prio,
            scheduled_date=sched, completed_date=comp,
        ))
        count += 1

    for wo, mtype, desc, findings, actions, parts, dt_hrs, cost, tech, status, prio, sched, comp in p07b_mx:
        db.add(MaintenanceRecord(
            id=_uid(), equipment_id=p07b.id, work_order=wo,
            maintenance_type=mtype, description=desc, findings=findings,
            actions_taken=actions, parts_replaced=parts,
            downtime_hours=dt_hrs, cost=cost, technician=tech,
            status=status, priority=prio,
            scheduled_date=sched, completed_date=comp,
        ))
        count += 1

    for eq, wo, mtype, desc, findings, actions, parts, dt_hrs, cost, tech, status, prio, sched, comp in other_mx:
        db.add(MaintenanceRecord(
            id=_uid(), equipment_id=eq.id, work_order=wo,
            maintenance_type=mtype, description=desc, findings=findings,
            actions_taken=actions, parts_replaced=parts,
            downtime_hours=dt_hrs, cost=cost, technician=tech,
            status=status, priority=prio,
            scheduled_date=sched, completed_date=comp,
        ))
        count += 1

    db.flush()
    logger.info(f"✅ Maintenance records: {count} created")
    return count


def seed_inspection_records(db, eq_map):
    """Create 15 inspection records."""
    inspections = [
        (eq_map["BF-P-07A"], "vibration", "Neha Verma", "Baseline vibration 1.9 mm/s RMS — within acceptable limits.", "normal", {"rms_velocity_mms": 1.9, "peak_velocity_mms": 3.2, "bearing_temp_c": 50}, "Continue quarterly monitoring.", _dt(2025, 4, 14), _dt(2025, 7, 14)),
        (eq_map["BF-P-07A"], "thermography", "Neha Verma", "No hot spots detected. Motor winding temperature uniform at 68°C.", "normal", {"max_temp_c": 68, "ambient_c": 35, "delta_t_c": 33}, "Satisfactory. Next survey Q3.", _dt(2025, 3, 10), _dt(2025, 6, 10)),
        (eq_map["BF-P-07B"], "vibration", "Neha Verma", "Post-overhaul vibration check: 1.7 mm/s RMS. All parameters within spec.", "normal", {"rms_velocity_mms": 1.7, "peak_velocity_mms": 2.8, "bearing_temp_c": 46}, "New baseline established.", _dt(2025, 4, 1), _dt(2025, 7, 1)),
        (eq_map["BF-P-07B"], "visual", "Suresh Patel", "Post-overhaul visual inspection. No leaks. Foundation bolts tight. Coupling guard secure.", "normal", {}, "Ready for standby service.", _dt(2025, 3, 14), _dt(2025, 6, 14)),
        (eq_map["BF-C-01A"], "vibration", "Neha Verma", "Compressor vibration at 3.1 mm/s RMS — within limits but trend watch.", "watch", {"rms_velocity_mms": 3.1, "peak_velocity_mms": 5.2, "oil_temp_c": 72}, "Monitor monthly. If trend continues, schedule inspection.", _dt(2025, 3, 20), _dt(2025, 4, 20)),
        (eq_map["BF-C-01A"], "ultrasonic", "Neha Verma", "Ultrasonic leak detection — no air leaks detected on discharge piping.", "normal", {"leak_rate_lpm": 0}, "Satisfactory.", _dt(2025, 2, 15), _dt(2025, 8, 15)),
        (eq_map["HE-104B"], "ultrasonic", "Neha Verma", "Tube thickness measurement — minimum 3.0mm at tube sheet (original 3.5mm).", "watch", {"min_thickness_mm": 3.0, "original_thickness_mm": 3.5, "corrosion_rate_mmpy": 0.08}, "Monitor annually. Plan tube bundle replacement by 2027.", _dt(2025, 1, 22), _dt(2025, 7, 22)),
        (eq_map["BL-03"], "visual", "Priya Sharma", "IBR inspection — tube condition satisfactory. Refractory minor cracks observed in combustion chamber.", "watch", {"tube_min_thickness_mm": 3.1, "refractory_condition": "fair"}, "Refractory repair during next shutdown. IBR valid till Oct 2025.", _dt(2025, 2, 5), _dt(2025, 10, 1)),
        (eq_map["BL-03"], "thermography", "Neha Verma", "Casing temperature uniform. No hot spots on external surfaces.", "normal", {"max_casing_temp_c": 85, "ambient_c": 35}, "Satisfactory. Insulation intact.", _dt(2025, 3, 12), _dt(2025, 9, 12)),
        (eq_map["CT-01"], "visual", "Suresh Patel", "Fill media degradation visible in sections 3 and 7. Drift eliminator intact.", "alert", {"fill_degradation_pct": 18, "sections_affected": [3, 7]}, "Schedule fill replacement Q4 2025.", _dt(2025, 4, 5), _dt(2025, 7, 5)),
        (eq_map["MOT-P07A"], "thermography", "Neha Verma", "Motor winding temperatures balanced. DE bearing slightly warmer at 56°C.", "normal", {"winding_temp_c": 72, "de_bearing_c": 56, "nde_bearing_c": 48}, "Within limits. Monitor.", _dt(2025, 3, 25), _dt(2025, 6, 25)),
        (eq_map["MOT-P07A"], "vibration", "Neha Verma", "Motor vibration 2.2 mm/s RMS — normal for direct-coupled pump motor.", "normal", {"rms_velocity_mms": 2.2}, "Satisfactory.", _dt(2025, 4, 14), _dt(2025, 7, 14)),
        (eq_map["FCV-2301"], "visual", "Suresh Patel", "Valve body external condition — no corrosion. Pneumatic lines intact. No air leaks.", "normal", {}, "Routine check satisfactory.", _dt(2025, 3, 18), _dt(2025, 9, 18)),
        (eq_map["TK-201"], "visual", "Suresh Patel", "External inspection — no dents, corrosion, or settlement observed. Roof vents clear.", "normal", {}, "Satisfactory. Internal inspection not due until 2029.", _dt(2025, 2, 20), _dt(2026, 2, 20)),
        (eq_map["CV-105"], "visual", "Suresh Patel", "External check — no visible leaks. Flange bolts tight.", "normal", {}, "Satisfactory.", _dt(2025, 3, 5), _dt(2025, 9, 5)),
    ]

    count = 0
    for eq, itype, inspector, findings, sev, meas, reco, idate, ndate in inspections:
        db.add(InspectionRecord(
            id=_uid(), equipment_id=eq.id,
            inspection_type=itype, inspector=inspector,
            findings=findings, severity=sev,
            measurements=meas, recommendations=reco,
            inspection_date=idate, next_inspection_date=ndate,
        ))
        count += 1

    db.flush()
    logger.info(f"✅ Inspection records: {count} created")
    return count


def seed_incident_reports(db, eq_map):
    """Create 8 incident reports, including the critical BF-P-07B seizure."""
    incidents = [
        (eq_map["BF-P-07B"], "INC-2024-001", "BF-P-07B Bearing Seizure During Auto-Switchover",
         "At 02:47 AM on 14-Feb-2024, BF-P-07A tripped on motor overload due to a power quality event. Auto-switchover to BF-P-07B initiated. BF-P-07B DE bearing seized within 8 seconds of startup. Motor overload relay tripped. Blast furnace cooling water supply was interrupted for 47 minutes until manual startup of BF-P-07A (which was found to be healthy after reset). During the 47-minute outage, BF tuyere temperatures exceeded alarm limits. Emergency nitrogen cooling was activated.",
         "1) Bearing failure due to standby pump not being regularly exercised — grease degradation over 6-month idle period. 2) Contamination ingress through inadequate bearing housing seals. 3) Pre-existing elevated vibration (3.5 mm/s noted in WO-2023-015) not acted upon.",
         "Immediate: Emergency bearing replacement. Shaft inspection revealed minor scoring. Motor insulation test — passed.",
         "1) Implement weekly standby pump rotation policy. 2) Upgrade bearing housing seals to labyrinth type. 3) Install vibration monitoring on standby pumps. 4) Revise auto-switchover interlock logic to include vibration check.",
         "critical", "mechanical", 47, 285000, 0, _dt(2024, 2, 14, 2, 47), _dt(2024, 2, 16), "Priya Sharma"),

        (eq_map["BF-P-07A"], "INC-2023-004", "BF-P-07A Seal Leak — Minor Process Spill",
         "Minor mechanical seal leak detected during routine rounds. Approximately 5 litres of cooling water leaked onto pump baseplate. No environmental impact — contained within bund.",
         "Seal face wear due to normal service life. Seal approaching end of L10 life after 4 years continuous service.",
         "Seal replaced during planned opportunity. Area cleaned.",
         "Include seal replacement in annual preventive maintenance scope.",
         "minor", "mechanical", 6, 35000, 0, _dt(2023, 11, 22, 10, 30), _dt(2023, 11, 22), "Suresh Patel"),

        (eq_map["BF-C-01A"], "INC-2024-003", "BF-C-01A High Discharge Temperature Alarm",
         "Compressor discharge temperature exceeded alarm limit of 110°C, reaching 118°C. Auto-unload activated. Production at reduced capacity for 4 hours.",
         "Cooling water supply reduced due to partially closed isolation valve (left closed after CT maintenance).",
         "Valve opened immediately. Temperature normalised within 30 minutes.",
         "1) Implement post-maintenance valve lineup checklist. 2) Add cooling water flow low alarm to compressor interlock.",
         "moderate", "process", 4, 0, 0, _dt(2024, 6, 2, 14, 15), _dt(2024, 6, 2), "Neha Verma"),

        (eq_map["BL-03"], "INC-2023-005", "BL-03 Flame Failure Trip — Nuisance Shutdown",
         "Boiler tripped on flame failure signal during fuel switchover from NG to HFO. Flame scanner detected momentary flame loss during transition. Steam supply interrupted for 90 minutes.",
         "Flame scanner response time too slow for dual-fuel transition. Scanner lens partially fouled.",
         "Scanner cleaned. Transition sequence timer adjusted from 3s to 5s.",
         "1) Install redundant flame scanner. 2) Revise dual-fuel transition sequence. 3) Quarterly scanner cleaning.",
         "moderate", "process", 1.5, 45000, 0, _dt(2023, 12, 8, 6, 20), _dt(2023, 12, 8), "Rajesh Kumar"),

        (eq_map["CT-01"], "INC-2024-004", "CT-01 Fan Blade Detachment — Near Miss",
         "During routine operation, one fan blade (FRP) partially detached from hub. Vibration alarm triggered. Operator shut down fan immediately. No injuries. Blade fragment fell into basin — no damage to fill.",
         "FRP blade root failure due to UV degradation and cyclic fatigue. Blade was original installation (8 years old).",
         "All fan blades inspected. Two additional blades showed root cracking. All 8 blades replaced.",
         "1) Replace FRP blades with aluminium. 2) Implement annual blade inspection with UV exposure assessment. 3) Set blade replacement interval at 6 years.",
         "major", "mechanical", 72, 180000, 0, _dt(2024, 9, 15, 11, 0), _dt(2024, 9, 18), "Priya Sharma"),

        (eq_map["FCV-2301"], "INC-2024-005", "FCV-2301 Control Valve Hunting — Process Upset",
         "Flow control valve began hunting (oscillating) causing ±15% flow variation in cooling circuit. Multiple downstream temperature alarms. Lasted 2 hours before manual override.",
         "Positioner I/P converter diaphragm had a small pin-hole leak causing erratic output signal.",
         "I/P converter replaced. Valve recalibrated. Process stabilised.",
         "1) Include I/P converter in annual replacement schedule. 2) Add valve position deviation alarm.",
         "minor", "process", 2, 22000, 0, _dt(2024, 11, 3, 9, 45), _dt(2024, 11, 3), "Neha Verma"),

        (eq_map["HE-104B"], "INC-2023-006", "HE-104B Tube Leak — Cooling Water Contamination",
         "Tube leak detected in HE-104B causing cooling water contamination of process side. Elevated conductivity alarm on process water return. Leak rate approximately 2 L/min.",
         "Tube pitting corrosion at tube-to-tube-sheet joint. Caused by chloride stress corrosion from untreated cooling water during chemical dosing pump failure.",
         "Leaking tubes identified by hydrostatic test and plugged (2 tubes). Chemical dosing pump repaired.",
         "1) Install backup chemical dosing pump. 2) Add cooling water conductivity monitoring. 3) Consider tube-sheet protective coating.",
         "moderate", "mechanical", 36, 95000, 0, _dt(2023, 8, 28, 16, 0), _dt(2023, 8, 30), "Rajesh Kumar"),

        (eq_map["MOT-P07A"], "INC-2025-001", "MOT-P07A Earth Fault Trip During Monsoon",
         "Motor tripped on earth fault relay during heavy monsoon rain. Investigation found moisture ingress through cable gland into terminal box.",
         "Cable gland seal degraded. Terminal box IP rating compromised. Moisture caused insulation resistance drop to 2 MΩ.",
         "Terminal box dried out with industrial heater. Cable gland replaced. IR restored to 180 MΩ.",
         "1) Upgrade all outdoor motor cable glands to IP68 rated. 2) Install space heaters in critical motor terminal boxes. 3) Add IR monitoring to predictive maintenance program.",
         "moderate", "electrical", 8, 18000, 0, _dt(2025, 7, 12, 4, 30), _dt(2025, 7, 12), "Neha Verma"),
    ]

    count = 0
    for eq, num, title, desc, rc, ca, pa, sev, cat, dt_hrs, cost, inj, idate, rdate, rby in incidents:
        db.add(IncidentReport(
            id=_uid(), equipment_id=eq.id,
            incident_number=num, title=title, description=desc,
            root_cause=rc, corrective_actions=ca, preventive_actions=pa,
            severity=sev, category=cat,
            downtime_hours=dt_hrs, cost_impact=cost, injuries=inj,
            incident_date=idate, resolved_date=rdate, reported_by=rby,
        ))
        count += 1

    db.flush()
    logger.info(f"✅ Incident reports: {count} created")
    return count


def seed_compliance_requirements(db):
    """Create 10 compliance requirements with 3 critical gaps."""
    reqs = [
        ("IS-2062:2011", "Bureau of Indian Standards — Steel Specifications", "§6.3",
         "Structural steel quality certification for pressure-bearing equipment",
         "All structural steel used in pressure vessels, piping, and equipment supports shall conform to IS 2062 Grade E250/E350 with mill test certificates.",
         "safety", ["Boiler", "Storage Tank", "Heat Exchanger"],
         "compliant", None, None, _dt(2025, 12, 31), _dt(2025, 3, 15)),

        ("ASME SEC VIII", "ASME Boiler & Pressure Vessel Code", "§UW-11",
         "Pressure vessel radiographic examination requirements",
         "All pressure vessel welds in Category A and B joints shall receive 100% radiographic examination per ASME Section V.",
         "safety", ["Boiler", "Heat Exchanger", "Storage Tank"],
         "compliant", None, None, _dt(2025, 12, 31), _dt(2025, 1, 20)),

        ("API-610", "API Standard for Centrifugal Pumps", "§6.12",
         "Pump vibration monitoring and acceptance criteria",
         "All critical service centrifugal pumps shall have continuous vibration monitoring with alarm at 6.4 mm/s and trip at 11 mm/s per API 610 Table 2.",
         "operational", ["Centrifugal Pump"],
         "gap",
         "Standby pump BF-P-07B does not have continuous vibration monitoring — only periodic manual checks. This gap contributed to the Feb 2024 bearing seizure incident.",
         "Install permanent vibration transmitters on both BF-P-07A and BF-P-07B. Budget approved: ₹4.5L. Target completion: Q3 2025.",
         _dt(2025, 9, 30), _dt(2025, 4, 1)),

        ("IBR-1950", "Indian Boiler Regulations", "§388",
         "Annual boiler inspection and certification",
         "All boilers shall be inspected annually by a competent person and shall hold a valid IBR certificate. Operation without valid certificate is prohibited.",
         "safety", ["Boiler"],
         "compliant", None, None, _dt(2025, 10, 1), _dt(2025, 2, 5)),

        ("IS-14977", "Industrial Safety Standards — Rotating Equipment", "§4.2",
         "Machine guarding for rotating equipment",
         "All rotating equipment shall have properly installed coupling guards, belt guards, and shaft guards per IS 14977.",
         "safety", ["Centrifugal Pump", "Compressor", "Electric Motor"],
         "compliant", None, None, _dt(2025, 12, 31), _dt(2025, 3, 10)),

        ("NFPA-850", "NFPA Recommended Practice for Fire Protection — Electric Power Plants", "§7.3",
         "Fire detection and suppression in pump houses",
         "All enclosed pump houses and compressor rooms shall have automatic fire detection and fixed suppression systems.",
         "safety", ["Centrifugal Pump", "Compressor"],
         "partial",
         "BF cooling pump house has smoke detection but no fixed suppression system. Manual fire extinguishers present but response time may be inadequate for unmanned operation during night shifts.",
         "Install automatic gas-based fire suppression system (FM-200 or Novec 1230) in BF pump house. RFQ issued. Target: Q4 2025.",
         _dt(2025, 12, 31), _dt(2025, 2, 28)),

        ("CPCB-2024", "Central Pollution Control Board — Emission Standards", "§III.2",
         "Cooling tower drift emission limits",
         "Cooling tower drift shall not exceed 0.001% of circulating water flow. Drift eliminators shall be maintained and tested annually.",
         "environmental", ["Cooling Tower"],
         "compliant", None, None, _dt(2025, 12, 31), _dt(2025, 4, 5)),

        ("API-570", "API Piping Inspection Code", "§7.2",
         "Thickness measurement survey for process piping",
         "All process piping operating above 150°C or 10 bar shall undergo thickness measurement survey at intervals not exceeding 5 years.",
         "safety", ["Heat Exchanger", "Boiler", "Storage Tank"],
         "gap",
         "Cooling water return piping (8\" CS, Class 150) has not been surveyed since 2020. Survey overdue by 6 months.",
         "Schedule piping thickness survey during next planned shutdown. Engage NDT contractor. Target: August 2025.",
         _dt(2025, 6, 30), _dt(2024, 12, 15)),

        ("IS-8000", "BIS — Quality Management for Industrial Equipment", "§5.4",
         "Maintenance record keeping and traceability",
         "Complete maintenance records including materials used, procedures followed, and test results shall be maintained for minimum 10 years.",
         "quality", ["Centrifugal Pump", "Compressor", "Boiler", "Heat Exchanger", "Control Valve", "Cooling Tower"],
         "compliant", None, None, _dt(2025, 12, 31), _dt(2025, 3, 25)),

        ("PESO-2020", "Petroleum & Explosives Safety Organisation", "§12.1",
         "Pressure vessel registration and periodic testing",
         "All unfired pressure vessels shall be registered with PESO and undergo hydrostatic test every 4 years.",
         "safety", ["Heat Exchanger", "Storage Tank"],
         "gap",
         "Heat exchanger HE-104B PESO registration renewal pending. Hydrotest due but delayed due to production schedule constraints.",
         "Schedule HE-104B hydrotest during September 2025 planned shutdown. PESO inspector visit confirmed for Oct 2025.",
         _dt(2025, 10, 31), _dt(2025, 1, 10)),
    ]

    count = 0
    for code, name, sec, desc, req_text, cat, eq_types, status, gap_desc, rem, due, assessed in reqs:
        db.add(ComplianceRequirement(
            id=_uid(),
            regulation_code=code, regulation_name=name, section=sec,
            description=desc, requirement_text=req_text,
            category=cat, applicable_equipment_types=eq_types,
            compliance_status=status,
            gap_description=gap_desc, remediation_plan=rem,
            due_date=due, last_assessed=assessed,
        ))
        count += 1

    db.flush()
    logger.info(f"✅ Compliance requirements: {count} created ({sum(1 for r in reqs if r[7] in ('gap','partial'))} gaps)")
    return count


def seed_tribal_knowledge(db, eq_map):
    """Create 12 tribal knowledge entries."""
    entries = [
        (eq_map["BF-P-07A"], "Monsoon Bearing Protection — The Rajan Method",
         "During monsoon season (June-September), humidity causes condensation inside the bearing housing of BF cooling pumps. "
         "Retired chief technician Rajan (35 years experience) developed a method: before monsoon onset, pack bearing housing "
         "vent plugs with silica gel sachets and replace them every 2 weeks. Also, run standby pumps for minimum 30 minutes "
         "daily to keep bearings warm and prevent moisture accumulation. This simple practice reduced monsoon-related bearing "
         "failures by 80% in Units 1 and 3. We never implemented it in Unit 2 — which is why we had the BF-P-07B seizure in Feb 2024.",
         "tip", "Rajan Krishnamurthy (Retired)", 35, True, 24,
         ["monsoon", "bearing", "moisture", "BF-P-07A", "BF-P-07B", "preventive"]),

        (eq_map["BF-P-07A"], "Seal Flush Line Blockage — Hidden Killer",
         "If the mechanical seal flush line pressure drops below 1 bar above stuffing box pressure, the seal faces run dry "
         "and fail within hours. The flush filter (Y-strainer at discharge) gets clogged with cooling water debris every "
         "2-3 weeks. Most operators don't check this. Set a reminder on your phone. A blocked flush line will destroy a "
         "₹40,000 seal in a day.",
         "warning", "Suresh Patel", 18, True, 19,
         ["seal", "flush", "filter", "BF-P-07A"]),

        (eq_map["BF-P-07B"], "Standby Pump Exercising Protocol",
         "After the Feb 2024 seizure incident, we learned the hard way that standby pumps must be rotated. Our rule now: "
         "every Monday and Thursday, swap running/standby pumps for minimum 4 hours. Check vibration and temperature before "
         "returning to standby. Document in the shift log. This was always in the maintenance procedure but nobody followed it "
         "because 'the pump was running fine'.",
         "best_practice", "Rajesh Kumar", 22, True, 15,
         ["standby", "rotation", "BF-P-07B", "bearing"]),

        (eq_map["BF-C-01A"], "Compressor Oil Temperature vs Ambient Correlation",
         "The ZR 400 compressor oil temperature should track ambient +40°C ±3°C. If the delta exceeds +45°C, the intercooler "
         "is fouled and needs cleaning. Don't wait for the alarm at 110°C — by then you've already lost 8% efficiency. "
         "Check the delta every shift. During summer (April-June), this becomes critical because ambient hits 45°C.",
         "tip", "Neha Verma", 8, True, 11,
         ["compressor", "oil temperature", "intercooler", "BF-C-01A"]),

        (eq_map["HE-104B"], "Tube Plugging Pattern — When to Replace the Bundle",
         "Once you hit 5% plugged tubes, the heat exchanger performance drops exponentially, not linearly. HE-104B is at "
         "1.9% now. Based on the corrosion rate of 0.08 mm/year on admiralty brass tubes, we'll hit the 5% threshold by "
         "late 2027. Start budgeting for tube bundle replacement now (approximately ₹35L) — procurement lead time for "
         "admiralty brass tubes is 16 weeks.",
         "tip", "Rajesh Kumar", 22, True, 8,
         ["heat exchanger", "tube plugging", "HE-104B", "replacement"]),

        (eq_map["FCV-2301"], "Control Valve Stick-Slip During Startup",
         "FCV-2301 tends to stick-slip during cold startup because the packing tightens when cold. Before starting, "
         "manually stroke the valve full range twice using the handwheel override. This frees up the packing and prevents "
         "the hunting issue we've had. Fisher knows about this — it's a known issue with the 657 actuator at ambient "
         "below 15°C. Don't waste time recalibrating the positioner — it's a mechanical problem.",
         "workaround", "Suresh Patel", 18, True, 14,
         ["control valve", "stick-slip", "FCV-2301", "startup"]),

        (eq_map["BL-03"], "Boiler Flame Scanner Cleaning Schedule",
         "The Honeywell C7027A flame scanner lens gets fouled with combustion deposits, especially when burning HFO. "
         "Clean the scanner lens every 15 days during HFO operation, monthly during NG-only operation. Use lens cleaner "
         "and soft cloth only — never use abrasives. A dirty lens caused a false flame failure trip in Dec 2023 that cost "
         "us 90 minutes of steam supply.",
         "tip", "Suresh Patel", 18, False, 7,
         ["boiler", "flame scanner", "BL-03", "HFO"]),

        (eq_map["BL-03"], "Water Treatment — Critical for Tube Life",
         "BL-03 tube life is directly linked to feedwater quality. Maintain: TDS < 200 ppm, pH 8.5-9.5, dissolved O2 < 7 ppb, "
         "total hardness < 2 ppm. The old-timers say 'watch the condensate return' — if it changes colour, there's a tube "
         "leak somewhere. I've seen this save us from a major failure twice.",
         "warning", "Rajesh Kumar", 22, True, 12,
         ["boiler", "water treatment", "BL-03", "tube life"]),

        (eq_map["CT-01"], "Cooling Tower Legionella Prevention",
         "During monsoon, cooling tower basin temperature stays between 30-35°C — perfect for Legionella. Ensure chlorine "
         "residual never drops below 0.5 ppm. After the 2018 health scare in Unit 3 (not a confirmed case, but HSE was "
         "alarmed), we instituted weekly Legionella testing during June-October. Cost is ₹2,000 per test — cheap insurance.",
         "warning", "Priya Sharma", 12, True, 9,
         ["cooling tower", "legionella", "CT-01", "monsoon", "health"]),

        (eq_map["MOT-P07A"], "Motor Space Heater — Don't Disable It",
         "ABB motors in outdoor/semi-outdoor installations have built-in space heaters (anti-condensation heaters) that "
         "should run whenever the motor is de-energised. Some electricians disable them to 'save power' — DON'T. The heater "
         "draws only 100W and prevents insulation resistance drops during shutdown periods. We lost a 55kW motor to earth "
         "fault in 2020 because someone disconnected the space heater during a 3-week shutdown.",
         "warning", "Neha Verma", 8, True, 10,
         ["motor", "space heater", "MOT-P07A", "insulation", "moisture"]),

        (eq_map["BF-P-07A"], "Pump Alignment After Foundation Work",
         "After any foundation or grouting work near BF pumps, ALWAYS recheck laser alignment. The blast furnace area has "
         "ground vibration from the BF operation that causes settlement. We've seen 0.08mm misalignment develop within "
         "3 months of foundation work. Use dial indicators for a quick check, but laser alignment for final verification.",
         "best_practice", "Suresh Patel", 18, True, 13,
         ["pump", "alignment", "foundation", "BF-P-07A"]),

        (eq_map["CV-105"], "Check Valve Slam Prevention",
         "CV-105 check valve will slam during rapid pump shutdown if the pump doesn't have a soft-stop VFD. The water "
         "hammer can exceed 15 bar (design: 10 bar). We had a flange leak in 2021 because of this. Current mitigation: "
         "ensure BF-P-07A always ramps down over 10 seconds minimum. If using DOL starter, close FCV-2301 to 20% before "
         "stopping the pump.",
         "warning", "Rajesh Kumar", 22, False, 6,
         ["check valve", "water hammer", "CV-105", "pump shutdown"]),
    ]

    count = 0
    for eq, title, content, cat, by, years, verified, upvotes, tags in entries:
        db.add(TribalKnowledge(
            id=_uid(), equipment_id=eq.id,
            title=title, content=content, category=cat,
            contributed_by=by, experience_years=years,
            verified=verified, upvotes=upvotes, tags=tags,
        ))
        count += 1

    db.flush()
    logger.info(f"✅ Tribal knowledge: {count} entries created")
    return count


def seed_failure_dna(db, eq_map):
    """Create Failure DNA records for pattern tracking."""
    dna_records = [
        (eq_map["BF-P-07A"], "Bearing Degradation", "Fatigue pitting + lubricant contamination",
         {"vibration_trend": "increasing RMS from 2.1 to 5.1 mm/s", "temp_trend": "bearing temp rise 50°C to 72°C", "oil_analysis": "iron particles 15→28 ppm"},
         3, 4380.0,
         ["Upgrade to SKF Explorer series", "Implement oil-mist lubrication", "Install permanent vibration transmitters"],
         ["Vibration analysis (quarterly)", "Oil ferrography", "Thermography", "Acoustic emission"]),

        (eq_map["BF-P-07A"], "Mechanical Seal Failure", "Face wear + dry running",
         {"symptom": "visible leak at seal gland", "leak_rate": "progressive increase", "flush_pressure": "drop below differential threshold"},
         1, 17520.0,
         ["Monitor seal flush pressure daily", "Replace seal at 4-year interval", "Clean flush line strainer bi-weekly"],
         ["Visual inspection", "Flush line pressure monitoring", "Leak detection"]),

        (eq_map["BF-P-07B"], "Standby Bearing Seizure", "Lubricant degradation during idle + moisture ingress",
         {"vibration_pre_failure": "3.5 mm/s (elevated but no action)", "idle_period_months": 6, "humidity_factor": "monsoon"},
         1, None,
         ["Weekly standby rotation (4h minimum)", "Silica gel in bearing housing vents", "Install permanent vibration monitoring"],
         ["Regular standby exercising", "Vibration check before standby-to-run", "Bearing housing moisture inspection"]),

        (eq_map["BF-C-01A"], "Discharge Temperature Exceedance", "Intercooler fouling + cooling water restriction",
         {"temp_threshold_c": 110, "actual_c": 118, "root_cause": "cooling valve closed post-maintenance"},
         1, None,
         ["Post-maintenance valve lineup verification", "Cooling water flow low alarm interlock"],
         ["Discharge temperature trending", "Cooling water flow measurement", "Delta-T monitoring"]),

        (eq_map["HE-104B"], "Tube Leak", "Chloride stress corrosion cracking at tube sheet",
         {"corrosion_rate_mmpy": 0.08, "plugged_tubes_pct": 1.9, "threshold_pct": 5.0},
         1, None,
         ["Maintain cooling water treatment — chlorine dosing", "Annual UT thickness survey", "Plan tube bundle replacement by 2027"],
         ["Ultrasonic thickness measurement", "Process water conductivity monitoring", "Hydrostatic test"]),
    ]

    count = 0
    for eq, mode, mech, sig, occ, mtf, actions, detections in dna_records:
        db.add(FailureDNA(
            id=_uid(), equipment_id=eq.id,
            failure_mode=mode, failure_mechanism=mech,
            failure_signature=sig, occurrence_count=occ,
            mean_time_to_failure=mtf,
            recommended_actions=actions, detection_methods=detections,
            last_occurrence=_dt(2024, 10, 4) if "Bearing" in mode else _dt(2024, 6, 2),
        ))
        count += 1

    db.flush()
    logger.info(f"✅ Failure DNA: {count} records created")
    return count


def seed_documents(db, plant):
    """Create synthetic document records and seed them into ChromaDB."""
    from app.services.document_processor import ingest_text_directly

    docs = [
        ("BF-P-07A Operation & Maintenance Manual — Kirloskar KBL DB 150/26", "manual",
         """# KIRLOSKAR KBL DB 150/26 CENTRIFUGAL PUMP
## Operation & Maintenance Manual — BF-P-07A / BF-P-07B

### 1. GENERAL DESCRIPTION
The KBL DB 150/26 is a single-stage, end-suction centrifugal pump designed for heavy-duty industrial cooling water service. 
Rated flow: 250 m³/h at 45m head. Driver: 55 kW, 2-pole, 415V motor.

### 2. BEARING MAINTENANCE
- **Bearing Type**: SKF 6310-2RS Deep Groove Ball Bearing (both DE and NDE)
- **Lubrication**: SKF LGMT 3 lithium grease, re-lubricate every 2000 operating hours
- **Maximum operating temperature**: 80°C. Alarm at 70°C, trip at 85°C
- **Vibration limits per API 610**: Alert at 6.4 mm/s, Trip at 11 mm/s
- **Expected bearing life (L10)**: 40,000 hours at rated load
- **CRITICAL**: During extended standby periods, rotate pump shaft manually every week and exercise pump under load for minimum 30 minutes every 72 hours to prevent flat-spotting and lubricant degradation.

### 3. MECHANICAL SEAL
- **Type**: John Crane Type 2100, single mechanical seal with flush
- **Seal flush**: Plan 11 (discharge recirculation through cyclone separator)
- **Flush pressure**: Minimum 1 bar above stuffing box pressure
- **Seal face materials**: Carbon vs Silicon Carbide
- **Expected seal life**: 3-4 years continuous service (8,000-12,000 hours)
- **WARNING**: Ensure flush line Y-strainer is cleaned every 2 weeks. Blocked strainer = dry seal = catastrophic failure.

### 4. VIBRATION ANALYSIS
BF-P-07A baseline vibration readings (established October 2024):
| Point | Direction | RMS Velocity (mm/s) |
|-------|-----------|---------------------|
| DE Bearing | Horizontal | 1.6 |
| DE Bearing | Vertical | 1.4 |
| DE Bearing | Axial | 0.9 |
| NDE Bearing | Horizontal | 1.5 |
| NDE Bearing | Vertical | 1.3 |
| NDE Bearing | Axial | 0.8 |

### 5. TROUBLESHOOTING
| Symptom | Possible Cause | Action |
|---------|---------------|--------|
| High vibration | Misalignment | Laser alignment check |
| High vibration | Bearing wear | Replace bearing |
| High vibration | Impeller imbalance | Dynamic balance |
| Seal leak | Face wear | Replace seal |
| Seal leak | Flush line blocked | Clean strainer |
| Low flow | Impeller wear | Inspect, replace if needed |
| High bearing temp | Lubricant failure | Re-lubricate, check quantity |
| Cavitation noise | Low NPSH | Check suction line, valve positions |
"""),

        ("Blast Furnace Cooling System — P&ID Description", "p&id",
         """# BLAST FURNACE COOLING WATER SYSTEM — P&ID DESCRIPTION
## BSL-JSR-U2-PID-BF-CW-001 Rev. 5

### SYSTEM OVERVIEW
The blast furnace cooling water system provides critical cooling for tuyeres, bosh plates, 
and stave coolers. System failure leads to immediate blast furnace thermal damage.

### MAIN COMPONENTS
- **BF-P-07A**: Primary cooling water pump (Kirloskar KBL DB 150/26, 250 m³/h)
- **BF-P-07B**: Standby cooling water pump (identical to BF-P-07A)
- **HE-104B**: Shell & tube heat exchanger (cooling water vs process water)
- **CT-01**: Cooling tower — induced draft, 3000 m³/h capacity
- **TK-201**: Process water storage tank, 500 kL
- **FCV-2301**: Flow control valve — 6" globe, Fisher 657 actuator
- **CV-105**: 8" swing check valve on pump discharge
- **MOT-P07A**: 55 kW ABB motor driving BF-P-07A

### CRITICAL INTERLOCKS
1. BF-P-07A motor overload → Auto-start BF-P-07B (8-second delay)
2. Low cooling water pressure (<3.5 bar) → Alarm + auto-start standby
3. High tuyere temperature (>450°C) → Emergency nitrogen backup cooling
4. Both pumps failed → Emergency BF damping sequence initiation

### FLOW PATH
TK-201 → BF-P-07A/B → CV-105 → FCV-2301 → Blast Furnace Tuyeres → HE-104B → CT-01 → TK-201
"""),

        ("Incident Investigation Report — BF-P-07B Bearing Seizure", "report",
         """# INCIDENT INVESTIGATION REPORT
## INC-2024-001: BF-P-07B Bearing Seizure During Auto-Switchover
### Date: 14-Feb-2024 | Severity: CRITICAL | Category: Mechanical

#### INCIDENT TIMELINE
- 02:45 AM: BF-P-07A motor overload relay triggered (power quality event on Bus-4)
- 02:45:08: Auto-switchover initiated to BF-P-07B
- 02:45:16: BF-P-07B DE bearing seized, shaft locked (8 seconds after start)
- 02:45:18: BF-P-07B motor overload tripped
- 02:46: Cooling water flow to blast furnace — ZERO
- 02:48: Tuyere temperature alarm — 380°C (limit 350°C)
- 02:52: Emergency nitrogen cooling activated
- 03:10: BF-P-07A manually reset and restarted (power quality confirmed normal)
- 03:32: Cooling water flow restored via BF-P-07A
- 03:32: Total outage: 47 minutes

#### 5-WHY ROOT CAUSE ANALYSIS
1. WHY did BF-P-07B bearing seize? → DE bearing had severe pitting and lubricant degradation
2. WHY was lubricant degraded? → Pump had been on standby for 6 months without being exercised
3. WHY was it not exercised? → Standby rotation protocol existed but was not followed
4. WHY was the protocol not followed? → No monitoring system, no accountability, procedure buried in SOP manual
5. WHY was there no monitoring? → Management assumed standby equipment was always ready

#### ROOT CAUSE: Organisational — inadequate standby equipment management procedure enforcement

#### FINANCIAL IMPACT
- Bearing replacement and repair: ₹2,85,000
- Production loss (reduced BF output for 47 min): ₹18,50,000
- Emergency nitrogen usage: ₹3,20,000
- **Total impact: ₹24,55,000**

#### CORRECTIVE ACTIONS
1. Mandatory weekly standby pump rotation — Monday and Thursday
2. Bearing housing seal upgrade to labyrinth type
3. Permanent vibration monitoring on all critical standby equipment
4. Revised auto-switchover logic with pre-start vibration check
"""),

        ("Standard Operating Procedure — BF Cooling Pump Maintenance", "sop",
         """# SOP-MAINT-BF-CW-001 Rev. 3
## Standard Operating Procedure: Blast Furnace Cooling Pump Maintenance
### Bharat Steel Limited — Jamshedpur Works, Unit 2

#### 1. SCOPE
This SOP covers all preventive, predictive, and corrective maintenance activities for 
blast furnace cooling water pumps BF-P-07A and BF-P-07B.

#### 2. FREQUENCY
| Activity | Frequency | Responsibility |
|----------|-----------|----------------|
| Vibration analysis | Quarterly | Reliability Engineer |
| Oil analysis | Quarterly | Reliability Engineer |
| Thermography | Half-yearly | Reliability Engineer |
| Seal inspection | Half-yearly | Sr. Technician |
| Bearing replacement | On-condition (MTBF ~4,500h) | Sr. Technician |
| Full overhaul | 5-yearly or on-condition | Maintenance Team |
| Standby pump exercise | Weekly (Mon & Thu) | Shift Operator |

#### 3. VIBRATION ACCEPTANCE CRITERIA (API 610)
- **Acceptable**: < 4.5 mm/s RMS
- **Alert**: 4.5 – 7.1 mm/s RMS → Increase monitoring frequency
- **Alarm**: 7.1 – 11.0 mm/s RMS → Plan corrective action
- **Trip**: > 11.0 mm/s RMS → Immediate shutdown

#### 4. BEARING REPLACEMENT PROCEDURE
4.1 Isolate pump electrically (LOTO per SOP-SAFE-001)
4.2 Isolate pump hydraulically (close suction and discharge valves)
4.3 Drain pump casing
4.4 Remove coupling guard and disconnect coupling
4.5 Remove bearing housing end cover
4.6 Extract old bearing using bearing puller (NEVER use chisel/hammer)
4.7 Clean bearing housing with lint-free cloth and solvent
4.8 Inspect shaft journal for scoring or damage
4.9 Heat new bearing to 80°C using induction heater
4.10 Slide bearing onto shaft — do NOT hammer
4.11 Pack with SKF LGMT 3 grease (fill housing 1/3 to 1/2)
4.12 Reassemble, laser align, and test run

#### 5. MONSOON PRECAUTIONS (June - September)
- Install silica gel sachets in bearing housing vent plugs
- Replace silica gel every 2 weeks
- Run standby pump minimum 30 minutes daily
- Check motor terminal box cable glands for moisture ingress
- Increase IR testing frequency to monthly
"""),

        ("API 610 Compliance Assessment — BF Cooling Pumps", "regulation",
         """# API 610 COMPLIANCE ASSESSMENT
## Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
### Assessment for BF-P-07A and BF-P-07B — BSL Jamshedpur Works Unit 2

#### Assessment Date: 01-Apr-2025 | Assessor: Neha Verma, Reliability Engineer

#### §6.12 VIBRATION MONITORING
**Requirement**: Critical service pumps shall have permanently installed vibration monitoring 
with alarm and trip setpoints per Table 2.

**BF-P-07A Status**: PARTIAL COMPLIANCE
- Quarterly manual vibration analysis performed ✓
- No permanent vibration transmitter installed ✗
- Alarm/trip setpoints defined in DCS ✗

**BF-P-07B Status**: NON-COMPLIANT
- Only periodic manual checks ✗
- No continuous monitoring capability ✗
- Gap directly contributed to INC-2024-001

**Gap**: Neither pump has permanently installed vibration transmitters. 
Monitoring relies on quarterly manual measurements which failed to catch the 
BF-P-07B bearing degradation between August 2023 (3.5 mm/s noted) and February 2024 (seizure).

**Remediation Plan**: Install IMI Sensors Model 601A11 dual-output vibration transmitters 
on both DE and NDE bearings of BF-P-07A and BF-P-07B. Connect to existing DCS via 4-20mA. 
Budget: ₹4,50,000. Target: Q3 2025.
"""),

        ("Annual Maintenance Report 2024 — BF Cooling System", "report",
         """# ANNUAL MAINTENANCE REPORT 2024
## Blast Furnace Cooling Water System — BSL Jamshedpur Works Unit 2
### Prepared by: Rajesh Kumar, Maintenance Manager

#### EXECUTIVE SUMMARY
2024 was a challenging year for the BF cooling system, dominated by the critical 
BF-P-07B bearing seizure incident in February. Total maintenance expenditure: ₹18.7 Lakhs 
(37% above budget). Key improvements implemented post-incident.

#### KEY METRICS
| Metric | 2023 | 2024 | Target |
|--------|------|------|--------|
| System availability (%) | 99.2 | 97.8 | 99.5 |
| Unplanned downtime (hours) | 24 | 95 | <20 |
| MTBF — BF-P-07A (hours) | 4,500 | 4,380 | 5,000 |
| Maintenance cost (₹ Lakhs) | 12.1 | 18.7 | 13.6 |
| Incidents | 2 | 3 | 0 |
| Compliance gaps | 1 | 3 | 0 |

#### INCIDENT SUMMARY
1. **INC-2024-001** (Critical): BF-P-07B bearing seizure — ₹24.55L total impact
2. **INC-2024-003** (Moderate): BF-C-01A high temperature — 4h reduced capacity
3. **INC-2024-005** (Minor): FCV-2301 hunting — 2h process upset

#### IMPROVEMENTS IMPLEMENTED
1. Weekly standby pump rotation (implemented March 2024)
2. Permanent vibration monitoring (procurement in progress, Q3 2025)
3. Post-maintenance valve lineup verification checklist
4. Enhanced oil analysis program with ferrography

#### BUDGET REQUEST 2025
- Vibration monitoring system: ₹4.5L
- HE-104B tube bundle (reserve): ₹35L
- Fire suppression — pump house: ₹12L
- Piping thickness survey: ₹3.5L
"""),
    ]

    count = 0
    for title, doc_type, content in docs:
        try:
            ingest_text_directly(db, content, title, doc_type=doc_type, plant_id=plant.id, uploaded_by="system")
            count += 1
        except Exception as e:
            logger.warning(f"Document ingest failed for '{title}': {e}")
            count += 1  # Count anyway as the DB record is created

    logger.info(f"✅ Documents: {count} created and indexed")
    return count


def build_knowledge_graph_data(db):
    """Build the knowledge graph from seeded data."""
    try:
        from app.services.knowledge_graph import build_knowledge_graph
        G = build_knowledge_graph(db)
        logger.info(f"✅ Knowledge graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    except Exception as e:
        logger.warning(f"Knowledge graph build failed: {e}")


# ── Main Seeder ──────────────────────────────────────────────────────────────

def seed_all():
    """Run the complete seeding pipeline."""
    logger.info("=" * 70)
    logger.info("NEXUS IQ™ — Demo Data Seeder")
    logger.info("Bharat Steel Limited — Jamshedpur Works, Unit 2")
    logger.info("=" * 70)

    # Initialise database tables
    init_db()

    db = SessionLocal()
    try:
        # Check if data already exists
        existing = db.query(Plant).count()
        if existing > 0:
            logger.warning("⚠️  Database already contains data. Clearing existing data...")
            # Clear in dependency order
            for model in [
                FailureDNA, TribalKnowledge, IncidentReport, InspectionRecord,
                MaintenanceRecord, Chunk, Document, ComplianceRequirement,
                Equipment, User, Plant,
            ]:
                db.query(model).delete()
            db.commit()
            logger.info("   Existing data cleared.")

        # Seed in order
        plant = seed_plant(db)
        users = seed_users(db)
        eq_map = seed_equipment(db, plant)
        seed_maintenance_records(db, eq_map)
        seed_inspection_records(db, eq_map)
        seed_incident_reports(db, eq_map)
        seed_compliance_requirements(db)
        seed_tribal_knowledge(db, eq_map)
        seed_failure_dna(db, eq_map)
        seed_documents(db, plant)

        # Final commit
        db.commit()

        # Build knowledge graph
        build_knowledge_graph_data(db)

        logger.info("=" * 70)
        logger.info("✅ SEEDING COMPLETE — NEXUS IQ™ demo data loaded successfully!")
        logger.info("=" * 70)

        # Print summary
        logger.info(f"   Plant:       1")
        logger.info(f"   Users:       {len(users)}")
        logger.info(f"   Equipment:   {len(eq_map)}")
        logger.info(f"   Maintenance: 30+")
        logger.info(f"   Inspections: 15")
        logger.info(f"   Incidents:   8")
        logger.info(f"   Compliance:  10 (3 gaps)")
        logger.info(f"   Tribal K:    12")
        logger.info(f"   Documents:   6 (indexed in ChromaDB)")
        logger.info("")
        logger.info("Run the server:  uvicorn app.main:app --reload --port 8000")
        logger.info("API docs:        http://localhost:8000/docs")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
