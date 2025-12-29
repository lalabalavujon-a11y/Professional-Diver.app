import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

/**
 * 🔧 ADD UNDERWATER WELDING LESSONS
 * 
 * This script adds comprehensive underwater welding lessons to the existing
 * "Advanced Underwater Welding" track that currently has 0 lessons.
 */

async function addWeldingLessons() {
  console.log('🔧 Adding comprehensive underwater welding lessons...');

  try {
    // Get the existing underwater welding track
    const weldingTrackResult = await db.select({ id: tracks.id }).from(tracks).where(eq(tracks.slug, 'underwater-welding')).limit(1);
    
    if (!weldingTrackResult || weldingTrackResult.length === 0) {
      console.error('❌ Underwater welding track not found!');
      return;
    }
    
    const weldingTrackId = weldingTrackResult[0].id;
    console.log(`✅ Found underwater welding track: ${weldingTrackId}`);

    // Clear any existing lessons for this track
    await db.delete(lessons).where(eq(lessons.trackId, weldingTrackId));
    console.log('🧹 Cleared existing lessons for underwater welding track');

    // Add comprehensive underwater welding lessons
    const weldingLessons = [
      {
        title: "Underwater Welding Fundamentals & Safety",
        order: 1,
        content: `# Underwater Welding Fundamentals & Safety

**AI Tutor: Lisa Thompson - Underwater Welding Specialist**
*Expert in Marine Welding Operations with 12+ years in underwater welding techniques, quality control, and safety protocols*

Welcome to professional underwater welding training! I'm Lisa Thompson, your specialized AI tutor for underwater welding operations. Let's master the essential techniques and safety protocols required for commercial marine welding operations.

## Learning Objectives
- Master fundamental underwater welding principles and techniques
- Understand comprehensive safety protocols for wet welding operations
- Learn electrode selection and arc stability management
- Apply quality control procedures and inspection standards
- Develop skills for real-world commercial underwater welding scenarios

## Underwater Welding Fundamentals

### Wet Welding vs. Dry Welding
Understanding the two primary underwater welding methods:

#### Wet Welding (Hyperbaric Welding)
- **Process**: Direct arc welding in water environment
- **Advantages**: Faster setup, lower cost, greater mobility
- **Limitations**: Reduced arc stability, higher porosity risk
- **Applications**: Emergency repairs, temporary fixes, non-critical welds

#### Dry Welding (Habitat Welding)
- **Process**: Welding in pressurized dry environment
- **Advantages**: Superior weld quality, better control
- **Limitations**: Complex setup, higher cost, limited access
- **Applications**: Critical structural welds, permanent repairs

### Electrochemical Principles
Understanding the science behind underwater welding:

#### Arc Stability in Water
- **Gas Bubble Formation**: Hydrogen and oxygen bubble creation
- **Arc Column**: Electrical path through gas bubbles
- **Voltage Requirements**: Higher voltage needed for underwater conditions
- **Current Density**: Increased current requirements for penetration

#### Metal Transfer Mechanisms
- **Globular Transfer**: Large droplet formation in water
- **Spray Transfer**: Fine droplet transfer in dry conditions
- **Short Circuit Transfer**: Low voltage, high current transfer
- **Pulsed Transfer**: Controlled droplet transfer for quality

## Electrode Selection and Management

### Electrode Types for Underwater Welding

#### E6013 Electrodes
- **Characteristics**: All-position, easy striking
- **Applications**: General purpose underwater welding
- **Advantages**: Good arc stability, minimal spatter
- **Limitations**: Lower tensile strength, higher porosity

#### E7018 Electrodes
- **Characteristics**: Low hydrogen, high strength
- **Applications**: Critical structural welds
- **Advantages**: Superior mechanical properties
- **Limitations**: Requires dry storage, sensitive to moisture

#### Specialized Underwater Electrodes
- **Waterproof Coating**: Moisture-resistant flux coating
- **Extended Length**: Longer electrodes for underwater use
- **Enhanced Flux**: Improved gas bubble formation
- **Quality Control**: Strict storage and handling requirements

### Electrode Storage and Handling
Critical procedures for electrode management:

#### Storage Requirements
- **Temperature Control**: 70-80°F (21-27°C) storage temperature
- **Humidity Control**: Maximum 50% relative humidity
- **Container Sealing**: Airtight containers with desiccant
- **Rotation System**: First-in, first-out inventory management

#### Pre-Use Preparation
- **Visual Inspection**: Check for coating damage or moisture
- **Baking Procedure**: 250°F (121°C) for 2 hours if needed
- **Immediate Use**: Use within 4 hours of removal from storage
- **Waste Management**: Proper disposal of unused electrodes

## Safety Protocols and Procedures

### Electrical Safety in Wet Welding
Critical safety considerations for underwater electrical operations:

#### Electrical Hazards
- **Shock Risk**: Direct electrical contact with water
- **Ground Fault**: Equipment malfunction causing electrical leakage
- **Arc Flash**: Intense light and heat from welding arc
- **Equipment Failure**: Power source or cable malfunction

#### Safety Equipment Requirements
- **Insulated Tools**: Non-conductive hand tools and equipment
- **Ground Fault Interrupters**: GFCI protection on all circuits
- **Emergency Shutdown**: Quick-disconnect systems for power
- **Personal Protection**: Insulated gloves and protective clothing

#### Emergency Procedures
- **Power Shutdown**: Immediate power cutoff procedures
- **Rescue Protocols**: Emergency response for electrical incidents
- **Medical Response**: First aid for electrical shock
- **Equipment Isolation**: Safe equipment shutdown procedures

### Gas Management and Ventilation
Managing gas production during underwater welding:

#### Gas Bubble Formation
- **Hydrogen Production**: Primary gas from electrode flux
- **Oxygen Production**: Secondary gas from water decomposition
- **Bubble Size**: Large bubbles affecting visibility and stability
- **Gas Accumulation**: Buildup in confined spaces

#### Ventilation Requirements
- **Natural Ventilation**: Water current for gas dispersion
- **Forced Ventilation**: Mechanical systems for gas removal
- **Monitoring Systems**: Gas detection and alarm systems
- **Emergency Procedures**: Gas buildup response protocols

## Quality Control and Inspection

### Weld Quality Assessment
Professional standards for underwater weld evaluation:

#### Visual Inspection Criteria
- **Weld Profile**: Proper reinforcement and penetration
- **Surface Condition**: Smooth, uniform weld appearance
- **Defect Identification**: Cracks, porosity, undercut detection
- **Dimensional Accuracy**: Weld size and geometry verification

#### Non-Destructive Testing Methods
- **Magnetic Particle Testing**: Surface crack detection
- **Ultrasonic Testing**: Internal defect identification
- **Radiographic Testing**: X-ray examination of weld quality
- **Dye Penetrant Testing**: Surface defect detection

### Documentation and Certification
Professional record-keeping requirements:

#### Weld Documentation
- **Welding Procedure Specifications**: Detailed procedure records
- **Welder Qualifications**: Certification and competency records
- **Quality Control Reports**: Inspection and testing results
- **Repair Documentation**: Defect correction and rework records

#### Certification Standards
- **AWS D3.6M**: Underwater Welding Code compliance
- **API Standards**: Offshore structure welding requirements
- **Client Specifications**: Project-specific quality requirements
- **Regulatory Compliance**: Government and industry standards

## Practice Scenario: Pipeline Repair Welding

**Professional Scenario**: Emergency repair of 12-inch diameter steel pipeline with 3/8-inch wall thickness at 25-meter depth with 2-knot current and 5-meter visibility.

### Pre-Weld Assessment
- **Damage Evaluation**: Crack length, depth, and orientation assessment
- **Material Analysis**: Steel grade and thickness verification
- **Environmental Conditions**: Current, visibility, and temperature evaluation
- **Access Planning**: Safe approach and working position establishment

### Welding Procedure
1. **Surface Preparation**: Grinding and cleaning of weld area
2. **Electrode Selection**: E6013 electrode for wet welding conditions
3. **Welding Technique**: Stringer bead technique for quality control
4. **Quality Monitoring**: Continuous visual inspection during welding
5. **Post-Weld Inspection**: Comprehensive quality assessment

### Quality Assurance
- **Visual Inspection**: Complete weld profile and surface evaluation
- **Dimensional Check**: Weld size and reinforcement measurement
- **Defect Assessment**: Porosity, cracking, and undercut evaluation
- **Documentation**: Complete photographic and written records

This comprehensive training provides the professional foundation required for safe, effective underwater welding operations in commercial diving environments.`
      },
      {
        title: "Advanced Welding Techniques & Quality Control",
        order: 2,
        content: `# Advanced Welding Techniques & Quality Control

**AI Tutor: Lisa Thompson - Advanced Underwater Welding Specialist**

Building on fundamental skills, this module covers advanced underwater welding techniques, sophisticated quality control methods, and professional certification standards for commercial marine operations.

## Learning Objectives
- Master advanced underwater welding techniques and procedures
- Understand comprehensive quality control and testing methodologies
- Learn specialized welding applications for different materials
- Apply professional certification and documentation standards
- Develop expertise in complex underwater welding scenarios

## Advanced Welding Techniques

### Multi-Pass Welding Procedures
Complex welding techniques for thick materials:

#### Root Pass Techniques
- **Stringer Bead**: Straight-line welding for root penetration
- **Weaving Technique**: Side-to-side motion for wider coverage
- **Back-Step Method**: Welding in reverse direction for distortion control
- **Skip Welding**: Alternating sequence for heat management

#### Fill and Cap Passes
- **Layer Buildup**: Systematic layer-by-layer welding
- **Interpass Cleaning**: Slag removal between passes
- **Temperature Control**: Interpass temperature monitoring
- **Distortion Management**: Welding sequence for minimal distortion

### Specialized Welding Positions
Advanced techniques for difficult access situations:

#### Overhead Welding
- **Electrode Angle**: 15-20° drag angle for overhead work
- **Travel Speed**: Faster speed to prevent sagging
- **Arc Length**: Shorter arc length for better control
- **Body Position**: Stable positioning for consistent technique

#### Vertical Welding
- **Uphill Technique**: Welding upward for better penetration
- **Downhill Technique**: Welding downward for faster travel
- **Electrode Manipulation**: Controlled weaving for uniform coverage
- **Heat Management**: Temperature control for quality welds

#### Horizontal Welding
- **Gravity Effects**: Managing metal flow in horizontal position
- **Electrode Positioning**: Proper angle for horizontal welds
- **Travel Direction**: Consistent direction for uniform appearance
- **Penetration Control**: Adequate penetration without burn-through

## Material-Specific Welding Procedures

### Carbon Steel Welding
Standard procedures for carbon steel underwater welding:

#### Low Carbon Steel (A36, A572)
- **Electrode Selection**: E6013 or E7018 electrodes
- **Preheat Requirements**: Generally not required
- **Welding Parameters**: Standard current and voltage settings
- **Post-Weld Treatment**: Stress relief if required

#### High Strength Steel (A514, A517)
- **Electrode Selection**: E7018 or E8018 electrodes
- **Preheat Requirements**: 200-300°F (93-149°C) preheat
- **Welding Parameters**: Higher current for penetration
- **Post-Weld Treatment**: Stress relief and tempering

### Stainless Steel Welding
Specialized procedures for corrosion-resistant materials:

#### Austenitic Stainless Steel (304, 316)
- **Electrode Selection**: E308L or E316L electrodes
- **Heat Input Control**: Lower heat input to prevent sensitization
- **Interpass Temperature**: Maximum 300°F (149°C)
- **Post-Weld Cleaning**: Passivation treatment required

#### Duplex Stainless Steel (2205, 2507)
- **Electrode Selection**: E2209 or E2594 electrodes
- **Heat Input Control**: Precise control for phase balance
- **Cooling Rate**: Controlled cooling for proper microstructure
- **Testing Requirements**: Ferrite content verification

### Aluminum Welding
Advanced techniques for aluminum underwater welding:

#### Aluminum Alloy Selection
- **5xxx Series**: Good corrosion resistance, moderate strength
- **6xxx Series**: Heat treatable, good weldability
- **7xxx Series**: High strength, challenging weldability
- **Alloy Matching**: Proper filler metal selection

#### Welding Challenges
- **Oxide Layer**: Aluminum oxide removal requirements
- **Heat Conductivity**: High heat conductivity management
- **Thermal Expansion**: Distortion control techniques
- **Porosity Prevention**: Hydrogen absorption prevention

## Quality Control and Testing

### Comprehensive Testing Methods
Professional quality assurance procedures:

#### Destructive Testing
- **Tensile Testing**: Mechanical property verification
- **Bend Testing**: Ductility and soundness evaluation
- **Impact Testing**: Toughness assessment at service temperature
- **Hardness Testing**: Heat-affected zone hardness evaluation

#### Non-Destructive Testing
- **Visual Inspection**: Surface defect identification
- **Magnetic Particle Testing**: Surface and near-surface crack detection
- **Ultrasonic Testing**: Internal defect identification
- **Radiographic Testing**: X-ray examination for internal quality

### Weld Defect Analysis
Professional defect identification and correction:

#### Porosity Defects
- **Gas Porosity**: Hydrogen and oxygen bubble formation
- **Wormhole Porosity**: Elongated gas cavities
- **Cluster Porosity**: Grouped gas bubbles
- **Prevention Methods**: Proper electrode storage and technique

#### Cracking Defects
- **Hot Cracking**: Solidification cracking during cooling
- **Cold Cracking**: Hydrogen-induced cracking
- **Stress Cracking**: Residual stress-related cracking
- **Prevention Techniques**: Preheat, post-heat, and technique control

#### Incomplete Fusion
- **Lack of Fusion**: Incomplete joint formation
- **Incomplete Penetration**: Insufficient root penetration
- **Undercut**: Groove formation at weld toe
- **Correction Methods**: Proper technique and parameter adjustment

## Professional Certification and Standards

### Welder Qualification Requirements
Industry standards for underwater welder certification:

#### AWS D3.6M Certification
- **Written Examination**: Theory and procedure knowledge
- **Practical Testing**: Welding skill demonstration
- **Performance Qualification**: Specific procedure qualification
- **Renewal Requirements**: Periodic requalification standards

#### API 1104 Certification
- **Pipeline Welding**: Specialized pipeline welding qualification
- **Procedure Qualification**: Welding procedure specification testing
- **Welder Qualification**: Individual welder competency testing
- **Quality Standards**: API quality assurance requirements

### Documentation and Record Keeping
Professional documentation requirements:

#### Welding Procedure Specifications (WPS)
- **Procedure Development**: Detailed procedure creation
- **Qualification Testing**: Procedure validation testing
- **Approval Process**: Client and regulatory approval
- **Implementation**: Field application and monitoring

#### Quality Control Records
- **Inspection Reports**: Detailed inspection documentation
- **Test Results**: Testing and analysis results
- **Defect Reports**: Non-conformance documentation
- **Corrective Actions**: Defect correction and prevention

## Advanced Practice Scenarios

### Scenario 1: Critical Structural Repair
**Situation**: Emergency repair of offshore platform leg with 2-inch thick steel at 40-meter depth.

**Requirements**:
- Multi-pass welding procedure
- Full penetration welds
- Radiographic testing
- Stress relief treatment

**Assessment Criteria**:
- Weld quality and integrity
- Procedure compliance
- Safety protocol adherence
- Documentation completeness

### Scenario 2: Pipeline Hot Tap Welding
**Situation**: Live pipeline welding for branch connection installation.

**Requirements**:
- Specialized hot tap procedures
- Pressure containment
- Fire safety protocols
- Emergency response procedures

**Assessment Criteria**:
- Safety protocol compliance
- Weld quality under pressure
- Emergency response capability
- Documentation accuracy

This advanced training ensures professional competency in complex underwater welding operations with comprehensive quality control and certification standards.`
      },
      {
        title: "Welding Equipment & Maintenance",
        order: 3,
        content: `# Welding Equipment & Maintenance

**AI Tutor: Lisa Thompson - Underwater Welding Equipment Specialist**

Professional underwater welding requires specialized equipment and comprehensive maintenance procedures. This module covers equipment selection, operation, maintenance, and troubleshooting for commercial underwater welding operations.

## Learning Objectives
- Master underwater welding equipment selection and operation
- Understand comprehensive maintenance and troubleshooting procedures
- Learn safety systems and emergency equipment requirements
- Apply equipment calibration and quality control standards
- Develop expertise in equipment management and documentation

## Underwater Welding Equipment Systems

### Power Sources and Generators
Critical equipment for underwater welding operations:

#### DC Power Sources
- **Constant Current (CC)**: Preferred for stick welding operations
- **Constant Voltage (CV)**: Used for wire feed applications
- **Pulse Welding**: Advanced control for quality improvement
- **Remote Control**: Surface control of underwater operations

#### Generator Requirements
- **Power Output**: Minimum 300-400 amps for underwater welding
- **Voltage Range**: 40-80 volts for arc stability
- **Duty Cycle**: 100% duty cycle for continuous operation
- **Environmental Rating**: Marine environment protection

#### Safety Features
- **Ground Fault Protection**: GFCI protection for electrical safety
- **Overload Protection**: Current and voltage overload protection
- **Emergency Shutdown**: Quick-disconnect safety systems
- **Remote Monitoring**: Surface monitoring of equipment status

### Welding Cables and Connections
Specialized electrical distribution systems:

#### Cable Specifications
- **Conductor Size**: Minimum #2 AWG for 300+ amp operations
- **Insulation**: Water-resistant, flexible insulation
- **Jacket Material**: Abrasion-resistant outer jacket
- **Length Requirements**: Adequate length for work area access

#### Connection Systems
- **Waterproof Connectors**: Submersible connection systems
- **Quick Disconnect**: Emergency disconnect capabilities
- **Strain Relief**: Proper cable strain management
- **Grounding**: Proper electrical grounding systems

#### Cable Management
- **Routing**: Safe cable routing and protection
- **Support**: Proper cable support and strain relief
- **Inspection**: Regular cable condition assessment
- **Replacement**: Timely cable replacement procedures

### Electrode Holders and Accessories
Specialized tools for underwater welding:

#### Electrode Holders
- **Insulated Design**: Non-conductive holder construction
- **Ergonomic Grip**: Comfortable handling for extended use
- **Electrode Clamping**: Secure electrode retention
- **Waterproof Construction**: Submersible design requirements

#### Welding Accessories
- **Chipping Hammers**: Slag removal tools
- **Wire Brushes**: Cleaning and preparation tools
- **Grinding Tools**: Surface preparation equipment
- **Measuring Tools**: Weld dimension verification

## Safety and Emergency Equipment

### Personal Protective Equipment
Essential safety gear for underwater welders:

#### Electrical Protection
- **Insulated Gloves**: Electrical shock protection
- **Rubber Boots**: Electrical insulation footwear
- **Insulated Tools**: Non-conductive hand tools
- **Protective Clothing**: Insulated work clothing

#### Welding Protection
- **Welding Helmet**: Eye and face protection
- **Welding Gloves**: Heat and spark protection
- **Welding Apron**: Body protection from sparks
- **Safety Glasses**: Additional eye protection

#### Diving Equipment Integration
- **Helmet Compatibility**: Welding helmet with diving helmet
- **Communication Systems**: Underwater communication integration
- **Emergency Systems**: Emergency ascent and rescue equipment
- **Life Support**: Breathing gas and life support systems

### Emergency Response Equipment
Critical safety systems for emergency situations:

#### Emergency Shutdown Systems
- **Power Cutoff**: Immediate power disconnection
- **Gas Shutoff**: Emergency gas supply cutoff
- **Communication Alerts**: Emergency communication systems
- **Rescue Equipment**: Emergency rescue and recovery systems

#### Fire Safety Equipment
- **Fire Extinguishers**: Appropriate fire suppression equipment
- **Fire Blankets**: Fire containment and suppression
- **Emergency Procedures**: Fire response protocols
- **Evacuation Plans**: Emergency evacuation procedures

## Equipment Maintenance and Calibration

### Preventive Maintenance Programs
Systematic equipment care and maintenance:

#### Daily Maintenance
- **Visual Inspection**: Equipment condition assessment
- **Function Testing**: Equipment operation verification
- **Cleaning Procedures**: Equipment cleaning and care
- **Documentation**: Maintenance record keeping

#### Weekly Maintenance
- **Detailed Inspection**: Comprehensive equipment examination
- **Calibration Check**: Equipment calibration verification
- **Performance Testing**: Equipment performance evaluation
- **Preventive Actions**: Proactive maintenance activities

#### Monthly Maintenance
- **Complete Overhaul**: Comprehensive equipment service
- **Parts Replacement**: Wear item replacement
- **Calibration Service**: Professional calibration service
- **Documentation Review**: Maintenance record analysis

### Calibration and Quality Control
Professional equipment calibration standards:

#### Electrical Calibration
- **Voltage Calibration**: Power source voltage accuracy
- **Current Calibration**: Welding current accuracy
- **Resistance Testing**: Cable and connection resistance
- **Insulation Testing**: Electrical insulation integrity

#### Mechanical Calibration
- **Pressure Gauges**: Gas pressure measurement accuracy
- **Flow Meters**: Gas flow measurement calibration
- **Temperature Sensors**: Temperature measurement accuracy
- **Timing Devices**: Equipment timing calibration

#### Documentation Requirements
- **Calibration Certificates**: Official calibration documentation
- **Calibration Intervals**: Scheduled calibration requirements
- **Traceability**: Calibration standard traceability
- **Compliance Records**: Regulatory compliance documentation

## Troubleshooting and Problem Resolution

### Common Equipment Problems
Typical issues and resolution procedures:

#### Electrical Problems
- **Power Loss**: Electrical supply interruption
- **Voltage Drop**: Insufficient voltage for welding
- **Current Fluctuation**: Unstable welding current
- **Ground Fault**: Electrical ground fault issues

#### Mechanical Problems
- **Cable Damage**: Welding cable deterioration
- **Connection Failure**: Electrical connection problems
- **Equipment Malfunction**: Mechanical equipment failure
- **Wear Issues**: Equipment wear and deterioration

#### Environmental Problems
- **Corrosion**: Equipment corrosion in marine environment
- **Contamination**: Equipment contamination issues
- **Temperature Effects**: Environmental temperature impact
- **Moisture Intrusion**: Water damage to equipment

### Problem Resolution Procedures
Systematic approach to equipment problems:

#### Problem Identification
- **Symptom Analysis**: Problem symptom identification
- **Root Cause Analysis**: Underlying cause determination
- **Impact Assessment**: Problem impact evaluation
- **Priority Classification**: Problem priority determination

#### Resolution Implementation
- **Solution Development**: Problem solution creation
- **Implementation Planning**: Solution implementation planning
- **Testing and Verification**: Solution testing and validation
- **Documentation**: Problem and solution documentation

#### Prevention Measures
- **Preventive Actions**: Problem prevention measures
- **Procedure Updates**: Procedure modification for prevention
- **Training Requirements**: Additional training for prevention
- **Monitoring Systems**: Ongoing monitoring for prevention

## Equipment Management and Documentation

### Inventory Management
Professional equipment inventory control:

#### Equipment Tracking
- **Asset Identification**: Unique equipment identification
- **Location Tracking**: Equipment location monitoring
- **Status Monitoring**: Equipment status tracking
- **Usage Records**: Equipment usage documentation

#### Maintenance Scheduling
- **Preventive Maintenance**: Scheduled maintenance activities
- **Calibration Scheduling**: Calibration schedule management
- **Replacement Planning**: Equipment replacement planning
- **Budget Planning**: Maintenance budget management

### Documentation and Record Keeping
Comprehensive equipment documentation:

#### Equipment Records
- **Purchase Documentation**: Equipment acquisition records
- **Specification Records**: Equipment specification documentation
- **Modification Records**: Equipment modification documentation
- **Disposal Records**: Equipment disposal documentation

#### Maintenance Records
- **Maintenance Logs**: Detailed maintenance activity records
- **Calibration Records**: Calibration activity documentation
- **Repair Records**: Equipment repair documentation
- **Performance Records**: Equipment performance monitoring

#### Compliance Documentation
- **Regulatory Compliance**: Regulatory requirement compliance
- **Safety Compliance**: Safety standard compliance
- **Quality Compliance**: Quality standard compliance
- **Audit Documentation**: Audit and inspection records

## Practice Scenario: Equipment Setup and Operation

**Professional Scenario**: Complete setup and operation of underwater welding equipment for offshore platform repair at 30-meter depth with 3-knot current.

### Equipment Setup Requirements
- **Power Source Installation**: Generator and power distribution setup
- **Cable Installation**: Welding cable routing and connection
- **Safety System Installation**: Safety and emergency system setup
- **Testing and Verification**: Complete system testing and verification

### Operation Procedures
- **Pre-Operation Checks**: Complete pre-operation equipment checks
- **Startup Procedures**: Proper equipment startup sequence
- **Operation Monitoring**: Continuous operation monitoring
- **Shutdown Procedures**: Proper equipment shutdown sequence

### Maintenance and Troubleshooting
- **Routine Maintenance**: Daily maintenance procedures
- **Problem Resolution**: Equipment problem identification and resolution
- **Documentation**: Complete operation and maintenance documentation
- **Quality Assurance**: Equipment performance and quality verification

This comprehensive equipment training ensures professional competency in underwater welding equipment management, maintenance, and operation for commercial diving operations.`
      },
      {
        title: "Final Assessment & Certification",
        order: 4,
        content: `# Final Assessment & Certification

**AI Tutor: Lisa Thompson - Underwater Welding Assessment Specialist**

This final module provides comprehensive assessment of underwater welding knowledge and skills, preparing students for professional certification and real-world commercial diving operations.

## Learning Objectives
- Complete comprehensive assessment of underwater welding knowledge
- Demonstrate practical welding skills and techniques
- Understand professional certification requirements and processes
- Apply safety protocols and quality control standards
- Prepare for professional underwater welding career advancement

## Comprehensive Knowledge Assessment

### Theoretical Knowledge Evaluation
Complete assessment of underwater welding theory:

#### Welding Fundamentals
- **Electrochemical Principles**: Arc stability and metal transfer in water
- **Electrode Selection**: Proper electrode selection for different applications
- **Welding Positions**: Techniques for various welding positions
- **Material Properties**: Understanding of different material characteristics

#### Safety and Quality Control
- **Safety Protocols**: Comprehensive safety procedure knowledge
- **Quality Standards**: Industry quality control and testing methods
- **Documentation Requirements**: Professional documentation standards
- **Emergency Procedures**: Emergency response and safety protocols

#### Equipment and Maintenance
- **Equipment Operation**: Proper equipment setup and operation
- **Maintenance Procedures**: Equipment maintenance and calibration
- **Troubleshooting**: Problem identification and resolution
- **Safety Systems**: Emergency and safety equipment operation

### Practical Skills Assessment
Hands-on evaluation of welding skills:

#### Basic Welding Techniques
- **Arc Striking**: Proper arc initiation and maintenance
- **Travel Speed**: Consistent travel speed control
- **Electrode Angle**: Proper electrode positioning and angle
- **Weld Quality**: Production of quality welds in various positions

#### Advanced Techniques
- **Multi-Pass Welding**: Complex multi-pass welding procedures
- **Specialized Positions**: Welding in difficult access positions
- **Material-Specific Techniques**: Welding different material types
- **Quality Control**: Application of quality control procedures

## Professional Certification Preparation

### AWS D3.6M Certification Requirements
Preparation for American Welding Society underwater welding certification:

#### Written Examination Preparation
- **Code Knowledge**: AWS D3.6M code requirements and standards
- **Procedure Knowledge**: Welding procedure specification requirements
- **Safety Standards**: Safety and health requirements
- **Quality Control**: Quality assurance and control procedures

#### Practical Examination Preparation
- **Welding Performance**: Demonstration of welding skills
- **Procedure Compliance**: Adherence to welding procedures
- **Quality Standards**: Meeting quality requirements
- **Safety Compliance**: Following safety protocols

#### Certification Process
- **Application Process**: Certification application procedures
- **Examination Scheduling**: Examination scheduling and preparation
- **Performance Evaluation**: Practical examination evaluation
- **Certification Maintenance**: Ongoing certification requirements

### Industry-Specific Certifications
Additional certifications for specialized applications:

#### API 1104 Pipeline Welding
- **Pipeline Procedures**: Specialized pipeline welding procedures
- **Quality Requirements**: Pipeline-specific quality standards
- **Testing Methods**: Pipeline welding testing requirements
- **Documentation**: Pipeline welding documentation standards

#### Offshore Structure Welding
- **Structural Procedures**: Offshore structure welding procedures
- **Environmental Considerations**: Offshore environment challenges
- **Safety Requirements**: Offshore safety and emergency procedures
- **Quality Standards**: Offshore structure quality requirements

## Real-World Application Scenarios

### Scenario 1: Emergency Pipeline Repair
**Situation**: Emergency repair of 16-inch diameter pipeline with 1/2-inch wall thickness at 35-meter depth with strong current and limited visibility.

**Assessment Requirements**:
- **Safety Assessment**: Complete safety protocol implementation
- **Procedure Development**: Appropriate welding procedure selection
- **Quality Control**: Comprehensive quality control application
- **Documentation**: Complete documentation and reporting

**Evaluation Criteria**:
- **Safety Compliance**: Adherence to all safety protocols
- **Technical Competency**: Proper welding technique application
- **Quality Achievement**: Meeting quality standards and requirements
- **Professional Conduct**: Professional behavior and communication

### Scenario 2: Critical Structural Repair
**Situation**: Repair of critical offshore platform structural member requiring full penetration welds with radiographic testing.

**Assessment Requirements**:
- **Complex Procedure**: Multi-pass welding with quality testing
- **Safety Management**: Advanced safety protocol implementation
- **Quality Assurance**: Comprehensive quality control and testing
- **Documentation**: Professional documentation and certification

**Evaluation Criteria**:
- **Technical Excellence**: Superior welding technique and quality
- **Safety Leadership**: Advanced safety protocol implementation
- **Quality Management**: Comprehensive quality control application
- **Professional Standards**: Meeting highest professional standards

## Career Development and Advancement

### Professional Development Opportunities
Career advancement in underwater welding:

#### Specialization Areas
- **Pipeline Welding**: Specialized pipeline welding expertise
- **Structural Welding**: Offshore structure welding specialization
- **Inspection and Testing**: Quality control and testing expertise
- **Training and Education**: Welding training and education roles

#### Advanced Certifications
- **Senior Welder**: Advanced welding certification levels
- **Welding Inspector**: Quality control and inspection certification
- **Welding Supervisor**: Leadership and management certification
- **Welding Engineer**: Engineering and procedure development

#### Continuing Education
- **Technical Updates**: Ongoing technical knowledge updates
- **Safety Training**: Continuous safety training and updates
- **Quality Standards**: Quality standard updates and changes
- **Industry Developments**: Industry technology and procedure updates

### Professional Networking and Resources
Building professional relationships and resources:

#### Professional Organizations
- **American Welding Society (AWS)**: Primary professional organization
- **Association of Diving Contractors International (ADCI)**: Diving industry organization
- **International Association of Underwater Engineering Contractors (IAUEC)**: International diving organization
- **National Association of Underwater Instructors (NAUI)**: Training and education organization

#### Industry Resources
- **Technical Publications**: Industry technical publications and journals
- **Training Programs**: Advanced training and certification programs
- **Conferences and Seminars**: Industry conferences and educational events
- **Online Resources**: Digital resources and online training programs

## Final Assessment and Evaluation

### Comprehensive Examination
Complete evaluation of knowledge and skills:

#### Written Examination
- **Multiple Choice Questions**: Theory and procedure knowledge
- **Short Answer Questions**: Detailed technical knowledge
- **Scenario Analysis**: Problem-solving and decision-making
- **Code Compliance**: Industry standard and code knowledge

#### Practical Examination
- **Welding Performance**: Hands-on welding skill demonstration
- **Procedure Application**: Proper procedure implementation
- **Quality Control**: Quality control procedure application
- **Safety Compliance**: Safety protocol implementation

#### Professional Assessment
- **Communication Skills**: Professional communication evaluation
- **Problem Solving**: Technical problem-solving ability
- **Leadership Potential**: Leadership and management potential
- **Professional Conduct**: Professional behavior and ethics

### Certification and Recognition
Professional recognition and certification:

#### Certification Award
- **Certificate of Completion**: Course completion certification
- **Professional Recognition**: Industry professional recognition
- **Continuing Education Credits**: Professional development credits
- **Career Advancement**: Career advancement opportunities

#### Ongoing Support
- **Mentorship Programs**: Professional mentorship opportunities
- **Career Counseling**: Career development and advancement counseling
- **Technical Support**: Ongoing technical support and assistance
- **Professional Development**: Continuous professional development opportunities

## Conclusion and Next Steps

### Course Completion Summary
Comprehensive review of course achievements:

#### Knowledge Gained
- **Technical Expertise**: Comprehensive underwater welding knowledge
- **Safety Competency**: Advanced safety protocol knowledge
- **Quality Control**: Professional quality control expertise
- **Professional Standards**: Industry standard and code knowledge

#### Skills Developed
- **Welding Techniques**: Advanced welding skill development
- **Equipment Operation**: Professional equipment operation skills
- **Problem Solving**: Technical problem-solving abilities
- **Professional Communication**: Professional communication skills

#### Career Preparation
- **Certification Readiness**: Professional certification preparation
- **Industry Knowledge**: Comprehensive industry knowledge
- **Professional Network**: Professional relationship development
- **Career Advancement**: Career advancement preparation

### Continuing Professional Development
Ongoing professional development recommendations:

#### Immediate Next Steps
- **Certification Pursuit**: Pursue professional certifications
- **Experience Building**: Gain practical experience opportunities
- **Skill Refinement**: Continue skill development and refinement
- **Professional Networking**: Build professional relationships

#### Long-Term Career Development
- **Specialization**: Develop specialized expertise areas
- **Leadership Development**: Develop leadership and management skills
- **Industry Involvement**: Active participation in professional organizations
- **Mentorship**: Provide mentorship to new professionals

Congratulations on completing the Advanced Underwater Welding training program! You now possess the knowledge, skills, and professional foundation required for successful career advancement in commercial underwater welding operations. Your commitment to professional excellence and continuous learning will serve you well in your career development and industry contributions.`
      }
    ];

    // Insert all welding lessons
    for (const lesson of weldingLessons) {
      await db.insert(lessons).values({
        trackId: weldingTrackId,
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        estimatedMinutes: 90,
        isRequired: true
      });
      console.log(`✅ Added lesson: ${lesson.title}`);
    }

    console.log('🎉 Successfully added all underwater welding lessons!');
    
    // Verify the lessons were added
    const lessonCount = await db.select().from(lessons).where(eq(lessons.trackId, weldingTrackId));
    console.log(`📊 Total lessons for underwater welding track: ${lessonCount.length}`);

  } catch (error) {
    console.error('❌ Error adding welding lessons:', error);
  }
}

// Run the script
addWeldingLessons()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
