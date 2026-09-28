import type {
  ProductTestEquipmentItem,
  ProductCalibrationRequirementItem,
} from '@bis/shared';

export interface ExtractedEquipmentDef {
  equipmentName: string;
  purpose: string;
  calibrationRequired: boolean;
  calibrationInterval: string;
  parameterMeasured: string;
  traceabilityStandard: string;
  sourceText?: string;
}

const STANDARD_EQUIPMENT_MAP: Record<string, ExtractedEquipmentDef[]> = {
  // Luminaires — IS 10322
  '10322': [
    {
      equipmentName: 'High Voltage Breakdown Dielectric Tester (0–5 kV AC)',
      purpose: 'Routine and type dielectric withstand testing between live parts and accessible metallic enclosure.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'AC Test Voltage (kV) and Trip Current (mA)',
      traceabilityStandard: 'NABL Accredited Calibration Laboratory / NPL Traceable',
      sourceText: 'Product Manual for Luminaires (STI) Section 3.1 Equipment Schedule.',
    },
    {
      equipmentName: 'Digital Insulation Resistance Tester (Megohmmeter 500 V DC)',
      purpose: 'Verification of 500 V DC insulation resistance across electrical insulation barriers.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Insulation Resistance (MΩ) and Applied Voltage (V DC)',
      traceabilityStandard: 'NABL Accredited Calibration Laboratory',
      sourceText: 'STI Luminaire Testing Schedule Clause 4.2.',
    },
    {
      equipmentName: 'Multi-Channel Temperature Data Logger with Thermocouples',
      purpose: 'Continuous thermal endurance monitoring of luminaire body, driver, and LED module during 240-hour burn-in.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Temperature (°C) across Class K Thermocouples',
      traceabilityStandard: 'NPL Traceable Reference Standard',
      sourceText: 'IS 10322 (Part 5/Sec 1) Clause 12 Thermal Endurance Requirements.',
    },
    {
      equipmentName: 'Spring-Operated Impact Hammer (0.35 Nm & 0.5 Nm)',
      purpose: 'Mechanical impact resistance verification of optical diffuser and housing.',
      calibrationRequired: true,
      calibrationInterval: '24 Months',
      parameterMeasured: 'Impact Energy (Joules/Nm)',
      traceabilityStandard: 'NABL Accredited Mechanical Calibration Facility',
      sourceText: 'IS 10322 (Part 5/Sec 1) Clause 4.13 Mechanical Tests.',
    },
  ],

  // Household Electrical Appliances — IS 302
  '302': [
    {
      equipmentName: 'Touch Current & Leakage Current Measuring System (IEC 60990 Network)',
      purpose: 'Measurement of touch current and earth leakage current under hot operating conditions.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Leakage Current (mA/μA) and Frequency Response',
      traceabilityStandard: 'NABL Accredited Electrical Calibration Lab',
      sourceText: 'IS 302 (Part 1) Clause 13 / STI Equipment Schedule.',
    },
    {
      equipmentName: 'Standard Jointed Test Finger (IEC 61032 Probe B)',
      purpose: 'Dimensional verification of ingress protection against live electrical parts.',
      calibrationRequired: true,
      calibrationInterval: '24 Months',
      parameterMeasured: 'Probe Dimensions (mm) and Applied Force Gauge (10 N)',
      traceabilityStandard: 'NABL Dimensional Calibration Laboratory',
      sourceText: 'IS 302 (Part 1) Clause 8 Protection Against Access to Live Parts.',
    },
    {
      equipmentName: 'High Voltage Breakdown Tester (0–3 kV AC)',
      purpose: 'Dielectric strength test for basic and reinforced insulation.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'High Voltage AC (kV) and Cutoff Current (mA)',
      traceabilityStandard: 'NPL Traceable Reference',
      sourceText: 'STI Household Appliances Clause 13.3.',
    },
  ],

  // Plugs and Sockets — IS 1293
  '1293': [
    {
      equipmentName: 'Hardened Steel GO & NO-GO Plug & Socket Dimensional Gauges',
      purpose: 'Routine 100% inspection of plug pin dimensions, spacing, and socket entry aperture tolerances.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Gauge Dimensions (mm, ±0.01 mm tolerance)',
      traceabilityStandard: 'NABL Accredited Precision Dimensional Calibration Lab',
      sourceText: 'IS 1293 Annex B Gauge Specifications & STI Clause 2.',
    },
    {
      equipmentName: 'Terminal Temperature Rise Testing Rig with Regulated AC Current Source',
      purpose: 'Measurement of terminal temperature rise carrying rated continuous current.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Current (A) and Temperature Rise (K)',
      traceabilityStandard: 'NABL Accredited Calibration Laboratory',
      sourceText: 'IS 1293 Clause 19 Temperature Rise Test.',
    },
    {
      equipmentName: 'Withdrawal Force Measurement Apparatus with Calibrated Test Plugs',
      purpose: 'Verification of minimum retention force and maximum withdrawal force from socket-outlet.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Force (Newtons, N)',
      traceabilityStandard: 'NABL Accredited Force Calibration Laboratory',
      sourceText: 'IS 1293 Clause 16 Mechanical Tests.',
    },
  ],

  // Drinking Water — IS 10500
  '10500': [
    {
      equipmentName: 'Digital Nephelometric Turbidimeter',
      purpose: 'Routine daily testing of drinking water turbidity.',
      calibrationRequired: true,
      calibrationInterval: '6 Months',
      parameterMeasured: 'Turbidity (NTU)',
      traceabilityStandard: 'Formazin Standard Solution Primary Reference',
      sourceText: 'STI Drinking Water (STI/10500) Schedule A.',
    },
    {
      equipmentName: 'Digital pH Meter with Temperature Compensation Probe',
      purpose: 'Continuous monitoring of water acidity/alkalinity at batch output.',
      calibrationRequired: true,
      calibrationInterval: 'Monthly Calibration against NIST Buffer Solutions (pH 4.0, 7.0, 9.2)',
      parameterMeasured: 'pH Value (0.00–14.00)',
      traceabilityStandard: 'NIST Traceable Standard Buffer Solutions',
      sourceText: 'STI Drinking Water Schedule A In-house Testing.',
    },
    {
      equipmentName: 'Laminar Airflow Workstation & Autoclave for Microbiological Inoculation',
      purpose: 'Sterile sample preparation and membrane filtration for E. coli / Coliform culture.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Airflow Velocity (m/s), Temperature (°C), and Pressure (psi)',
      traceabilityStandard: 'NABL Accredited Biological Testing Facility',
      sourceText: 'IS 10500 Microbiological Safety Protocol & STI Clause 4.',
    },
  ],

  // PVC Cables — IS 694
  '694': [
    {
      equipmentName: 'High Sensitivity Kelvin Double Bridge / Digital Micro-Ohmmeter',
      purpose: 'Measurement of electrical conductor resistance per kilometer at 20°C reference temperature.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Conductor Resistance (mΩ/Ω) and Ambient Temperature (°C)',
      traceabilityStandard: 'NABL Accredited Calibration Facility',
      sourceText: 'STI PVC Insulated Cables Clause 3.1 Conductor Resistance.',
    },
    {
      equipmentName: 'Continuous Spark Tester (0–10 kV High Voltage)',
      purpose: 'Online 100% dielectric spark testing during cable extrusion.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Spark Output Voltage (kV) and Fault Sensitivity',
      traceabilityStandard: 'NABL Accredited Calibration Laboratory',
      sourceText: 'IS 694 Clause 16.1 & STI Extrusion Testing Schedule.',
    },
    {
      equipmentName: 'Digital Optical Measuring Microscope / Dial Micrometer',
      purpose: 'Measurement of insulation and sheath wall thickness at 6 cross-sectional points.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Radial Thickness (mm, ±0.001 mm accuracy)',
      traceabilityStandard: 'NABL Dimensional Calibration Laboratory',
      sourceText: 'IS 694 Clause 8 & IS 10810 (Part 6).',
    },
  ],

  // Static Energy Meters — IS 14697
  '14697': [
    {
      equipmentName: 'Precision Reference Standard Meter (Accuracy Class 0.02S / 0.05S)',
      purpose: 'Routine accuracy calibration and limits of error verification for manufactured energy meters.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Active & Reactive Energy (kWh/kVARh) with Class 0.02S Precision',
      traceabilityStandard: 'National Physical Laboratory (NPL) New Delhi Primary Reference',
      sourceText: 'IS 14697 Clause 12 / Product Manual PM/14697.',
    },
    {
      equipmentName: 'High Voltage AC Dielectric Breakdown Tester (0–5 kV)',
      purpose: 'Routine high voltage isolation test between current/voltage circuits and auxiliary terminals.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Voltage (kV AC) and Leakage Trip Current (mA)',
      traceabilityStandard: 'NABL Accredited Electrical Calibration Lab',
      sourceText: 'STI 14697 Routine Testing Schedule Clause 2.',
    },
  ],

  // Tile Adhesives — IS 15477
  '15477': [
    {
      equipmentName: 'Universal Tensile Adhesion Testing Machine with Digital Force Transducer',
      purpose: 'Measurement of tensile adhesion strength and shear adhesion strength on concrete/tile substrates.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Tensile Force (N/kN) and Crosshead Travel Speed (mm/min)',
      traceabilityStandard: 'NABL Accredited Force & Displacement Calibration Lab',
      sourceText: 'IS 15477 Annex A / Product Manual PM/15477.',
    },
    {
      equipmentName: 'Precision Concrete Substrate Slabs and Standard Notched Trowels',
      purpose: 'Standard sample preparation for open time and slip resistance evaluation.',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      parameterMeasured: 'Trowel Notch Dimensions (mm) and Substrate Porosity',
      traceabilityStandard: 'NABL Dimensional Verification',
      sourceText: 'IS 15477 Clause 5 Test Methods.',
    },
  ],
};

/**
 * Extracts factory testing equipment checklist for a standard.
 */
export function extractEquipmentRequirements(
  standard: any,
  _productManual: any = null
): ProductTestEquipmentItem[] {
  const isNum = standard.isNumber || standard.title || '';
  const canonical = isNum.replace(/[^0-9]/g, '');

  let matchedDefs: ExtractedEquipmentDef[] = [];

  for (const [key, defs] of Object.entries(STANDARD_EQUIPMENT_MAP)) {
    if (isNum.includes(key) || canonical.includes(key)) {
      matchedDefs = defs;
      break;
    }
  }

  if (matchedDefs.length === 0) {
    matchedDefs = [
      {
        equipmentName: 'High Voltage Dielectric Strength Tester',
        purpose: `Routine dielectric test as required by ${standard.isNumber || 'governing standard'}.`,
        calibrationRequired: true,
        calibrationInterval: '12 Months',
        parameterMeasured: 'Voltage (kV) and Trip Current (mA)',
        traceabilityStandard: 'NABL Accredited Calibration Laboratory',
        sourceText: `Product Manual / STI for ${standard.title || 'standard'}.`,
      },
      {
        equipmentName: 'Digital Multimeter / Parameter Verifier',
        purpose: 'Verification of nominal electrical/physical ratings.',
        calibrationRequired: true,
        calibrationInterval: '12 Months',
        parameterMeasured: 'Voltage, Current, Resistance',
        traceabilityStandard: 'NABL Accredited Calibration Laboratory',
        sourceText: 'STI Factory Testing Schedule.',
      },
    ];
  }

  return matchedDefs.map((def, idx) => ({
    id: `equip-${standard.id || 'std'}-${idx + 1}`,
    analysisId: '',
    equipmentName: def.equipmentName,
    purpose: def.purpose,
    requiredStatus: 'REQUIRED',
    calibrationRequired: def.calibrationRequired,
    calibrationInterval: def.calibrationInterval,
    source: def.sourceText || 'BIS Scheme of Testing and Inspection (STI)',
    notes: `Must be maintained in working condition in manufacturer in-house testing laboratory with valid calibration certificates.`,
    rank: idx + 1,
    createdAt: new Date().toISOString(),
  }));
}

/**
 * Extracts calibration requirements for factory test equipment.
 */
export function extractCalibrationRequirements(
  standard: any,
  productManual: any = null
): ProductCalibrationRequirementItem[] {
  const equipment = extractEquipmentRequirements(standard, productManual);

  return equipment
    .filter((e) => e.calibrationRequired)
    .map((e, idx) => {
      const isNum = standard.isNumber || standard.title || '';
      const canonical = isNum.replace(/[^0-9]/g, '');

      let matchedDef = STANDARD_EQUIPMENT_MAP[canonical]?.find(
        (m) => m.equipmentName === e.equipmentName
      );

      return {
        id: `cal-${standard.id || 'std'}-${idx + 1}`,
        analysisId: '',
        equipmentName: e.equipmentName,
        parameterMeasured: matchedDef?.parameterMeasured || 'Operating Test Parameters',
        traceabilityStandard: matchedDef?.traceabilityStandard || 'NABL Accredited Calibration Laboratory / NPL Traceable',
        calibrationInterval: e.calibrationInterval || '12 Months',
        calibrationAgencyType: 'NABL_ACCREDITED_CAL_LAB',
        source: e.source || 'BIS Scheme of Testing and Inspection (STI)',
        notes: `Calibration certificate with measurement uncertainty must be preserved for BIS factory audit inspection.`,
        rank: idx + 1,
        createdAt: new Date().toISOString(),
      };
    });
}
