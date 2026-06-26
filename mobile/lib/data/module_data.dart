import 'package:flutter/material.dart';
import '../models/module_models.dart';
import '../features/modules/services/video_progress_service.dart';

/// Module Repository
/// Stateful singleton that caches modules and loads video progress from Hive
/// Phase: Video Progress Persistence Fix - Converted to singleton with cached modules
class ModuleRepository {
  static final ModuleRepository _instance = ModuleRepository._internal();
  factory ModuleRepository() => _instance;
  ModuleRepository._internal();

  List<LearningModule>? _modules;
  bool _isInitialized = false;
  bool _isInitializing = false;
  final VideoProgressService _videoProgressService = VideoProgressService();

  /// Initialize the repository
  /// Loads modules from data and restores video progress from Hive
  /// This must be called before getModules() is used
  Future<void> initialize() async {
    if (_isInitialized) {
      print('✅ [MODULE REPO] Already initialized');
      return;
    }

    if (_isInitializing) {
      // Wait for ongoing initialization
      while (_isInitializing) {
        await Future<void>.delayed(const Duration(milliseconds: 100));
      }
      return;
    }

    _isInitializing = true;
    print('🔄 [MODULE REPO] Initializing repository...');

    try {
      // 1. Load modules from static data
      _modules = _loadModulesFromData();
      print('✅ [MODULE REPO] Loaded ${_modules!.length} modules from data');

      // 2. Load video progress from Hive and update modules
      await _loadVideoProgress();
      print('✅ [MODULE REPO] Video progress loaded and applied');

      _isInitialized = true;
      print('✅ [MODULE REPO] Repository initialized successfully');
    } catch (e) {
      print('❌ [MODULE REPO] Error initializing repository: $e');
      // Still mark as initialized to prevent infinite loops
      _isInitialized = true;
    } finally {
      _isInitializing = false;
    }
  }

  /// Load modules from static data
  /// This is the original getModules() logic
  List<LearningModule> _loadModulesFromData() {
    return [
      LearningModule(
        id: 'covid',
        title: 'COVID-19 Safety',
        description: '''• Maintain 1-meter distance
                      • Wash hands frequently
                      • Wear masks correctly
                      • Avoid crowds & closed spaces
                      • Follow sector-wise protocols (schools, banks, essential services)
                      • Recognize COVID-19 as a biological disaster
                      • Promote hygiene, safety & coordinated action''',
        level: 'Intermediate',
        duration: '45 min',
        iconData: Icons.medical_services,
        color: Colors.redAccent.shade100,
        quizJsonPath: 'assets/module_quiz/covid-19_quiz.json',
        tags: ['biological', 'pandemic', 'health'],
        geographicRelevance: [], // Global
        videos: [
          VideoLesson(title: 'Elderly Care', size: '264 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Elderly%20Care.mp4'),
          VideoLesson(title: 'Immunity Boosters', size: '264 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Immunity%20Boosters.mp4'),
          VideoLesson(title: 'Safety of employees', size: '267 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Labour%20and%20Employment%20Continuation.mp4'),
          VideoLesson(title: 'Cleaning and disinfection', size: '262 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Personal%20Belongings.mp4'),
          VideoLesson(title: 'School Safety', size: '201 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/School%20and%20Educational%20Institutes.mp4'),
          VideoLesson(title: 'Social Stigma', size: '264 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Social%20Stigma.mp4'),
          VideoLesson(title: 'Urban Slums', size: '264 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Urban%20Slums.mp4'),
          VideoLesson(title: 'Public Transport', size: '271 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Public%20Transportation.mp4'),
          VideoLesson(title: 'Home Isolation', size: '634 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/covid/English/Home%20Isolation.m4v'),
        ],
      ),
      LearningModule(
        id: 'cyclone',
        title: 'Cyclone Preparedness',
        description: '''• Before: Prepare emergency kit, know evacuation routes, identify shelters
                      • During: Follow official warnings, stay calm, move to shelters when told
                      • After: Avoid downed wires, check water safety, return only when permitted
                      • Covers storm threats: wind, rain, storm surge''',
        level: 'Beginner',
        duration: '30 min',
        iconData: Icons.cyclone,
        color: Colors.blueGrey.shade200,
        quizJsonPath: 'assets/module_quiz/cyclone_quiz.json',
        tags: ['cyclone', 'storm', 'wind', 'rain'],
        geographicRelevance: ['Odisha', 'Andhra Pradesh', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Maharashtra', 'Kerala', 'Karnataka', 'Goa'],
        videos: [
          VideoLesson(title: 'Warning for Fishermen', size: '319 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/cyclone/English/Warning%20for%20Fishermen.mp4'),
          VideoLesson(title: 'Before Cyclone', size: '265 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/cyclone/English/Before%20Cyclone.mp4'),
          VideoLesson(title: 'Early Warning', size: '306 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/cyclone/English/Early%20Warning%20and%20Response.mp4'),
          VideoLesson(title: 'Indoors Safety', size: '360 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/cyclone/English/Indoors.mp4'),
          VideoLesson(title: 'Outdoors Safety', size: '263 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/cyclone/English/Outdoors.mp4'),
          VideoLesson(title: 'Secure House', size: '343 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/cyclone/English/Secure%20your%20house.mp4'),
        ],
      ),
      LearningModule(
        id: 'flood',
        title: 'Flood Safety',
        description: '''• Before: Make disaster kit, identify safe evacuation points
                      • During: Never enter floodwater (“Turn Around, Don’t Drown”), switch off electricity/gas
                      • After: Boil drinking water, check structural damage, avoid fallen wires
                      • Focus on: Prevent → Prepare → Respond → Recover''',
        level: 'Advanced',
        duration: '25 min',
        iconData: Icons.water_drop,
        color: Colors.blue.shade100,
        quizJsonPath: 'assets/module_quiz/flood_quiz.json',
        tags: ['flood', 'rain', 'water'],
        geographicRelevance: ['Assam', 'Bihar', 'Uttar Pradesh', 'West Bengal', 'Kerala', 'Maharashtra'],
        videos: [
          VideoLesson(title: 'Before Flood', size: '162 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/floods/Videos/English/Before%20Flood.mp4'),
          VideoLesson(title: 'During Flood', size: '160 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/floods/Videos/English/During%20Flood.mp4'),
          VideoLesson(title: 'After Flood', size: '141 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/floods/Videos/English/After%20Flood.mp4'),
        ],
      ),
      LearningModule(
        id: 'urban_flood',
        title: 'Urban Flood',
        description: '''• Early Warning System (FEWS) for real-time alerts
                      • Vulnerability & Risk Mapping in cities
                      • Improved drainage + Water-Sensitive Urban Design (WSUD)
                      • Solid waste control to prevent blockage
                      • Capacity building through drills & training''',
        level: 'Intermediate',
        duration: '20 min',
        iconData: Icons.apartment,
        color: Colors.indigo.shade100,
        quizJsonPath: 'assets/module_quiz/urban_flood_quiz.json',
        tags: ['flood', 'urban', 'city', 'rain'],
        geographicRelevance: ['Mumbai', 'Chennai', 'Delhi', 'Bangalore', 'Kolkata', 'Hyderabad'],
        videos: [
          VideoLesson(title: 'Before Urban Flood', size: '27.4 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/UrbanFlood/English/Before%20Urban%20Flood.mp4'),
          VideoLesson(title: 'During Urban Flood', size: '34.9 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/UrbanFlood/English/During%20Urban%20Flood.mp4'),
          VideoLesson(title: 'After Urban Flood', size: '27.5 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/UrbanFlood/English/After%20Urban%20Flood.mp4'),
        ],
      ),
      LearningModule(
        id: 'lightning',
        title: 'Lightning Safety',
        description: '''• Use early warning tools like Damini app
                      • Install lightning arresters
                      • Avoid tall objects; crouch low if outside
                      • Do NOT lie flat on the ground
                      • First aid: victim is safe to touch; seek immediate medical help''',
        level: 'Beginner',
        duration: '25 min',
        iconData: Icons.flash_on,
        color: Colors.yellow.shade200,
        quizJsonPath: 'assets/module_quiz/lightning_quiz.json',
        tags: ['lightning', 'storm', 'thunder'],
        geographicRelevance: [], // Widespread
        videos: [
          VideoLesson(title: 'Before Lightning', size: '110 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/lightning/New/English/Before%20Lightning.mp4'),
          VideoLesson(title: 'First Aid', size: '95.5 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/lightning/New/English/First%20Aid.mp4'),
          VideoLesson(title: 'Myths and Facts', size: '105 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/lightning/New/English/Myth%20and%20Facts.mp4'),
          VideoLesson(title: 'Shelter', size: '100 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/lightning/New/English/Shelter.mp4'),
          VideoLesson(title: 'Signs of Injuries', size: '78.2 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/lightning/New/EnglishSigns%20and%20Symptoms%20of%20Lightning%20Injuries.mp4'),
        ],
      ),
      LearningModule(
        id: 'heatwave',
        title: 'Heatwave',
        description: '''• Heat Alerts via Early Warning Systems
                      • Cooling centres, cool roofs, shaded areas
                      • Hospital readiness: ORS, staff training
                      • Public advice: hydrate, avoid peak sun, wear light clothing
                      • Prevent & respond to heatstroke''',
        level: 'Beginner',
        duration: '35 min',
        iconData: Icons.sunny,
        color: Colors.orangeAccent.shade100,
        quizJsonPath: 'assets/module_quiz/heatwave_quiz.json',
        tags: ['heat', 'sun', 'summer'],
        geographicRelevance: ['Rajasthan', 'Gujarat', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Odisha', 'Delhi', 'Uttar Pradesh'],
        videos: [
          VideoLesson(title: 'Protect Animals', size: '130 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/Heatwave/Video/English/Cattle.mp4'),
          VideoLesson(title: 'Cool Cities', size: '129 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/Heatwave/Video/English/Cool%20cities.mp4'),
          VideoLesson(title: 'Cool Homes', size: '124 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/Heatwave/Video/English/Cool%20Homes.mp4'),
        ],
      ),
      LearningModule(
        id: 'coldwave',
        title: 'Cold Wave',
        description: '''• Early warnings for extreme cold
                      • Public awareness: layering, safe heating, avoid CO poisoning
                      • Hospital readiness for hypothermia
                      • Provide shelters, warm clothes, livestock protection''',
        level: 'Intermediate',
        duration: '20 min',
        iconData: Icons.ac_unit,
        color: Colors.lightBlue.shade100,
        quizJsonPath: 'assets/module_quiz/coldwave_quiz.json',
        tags: ['cold', 'winter', 'snow'],
        geographicRelevance: ['Jammu and Kashmir', 'Himachal Pradesh', 'Uttarakhand', 'Punjab', 'Haryana', 'Delhi', 'Rajasthan', 'Uttar Pradesh'],
        videos: [
          VideoLesson(title: 'Farmers and Crops', size: '101 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/coldwave/English/Crops.mp4'),
          VideoLesson(title: 'During Cold Wave', size: '331 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/coldwave/English/During%20Cold%20Wave.mp4'),
        ],
      ),
      LearningModule(
        id: 'avalanche',
        title: 'Avalanche',
        description: '''• Early warning via SASE bulletins
                      • Hazard zoning & risk assessment
                      • Structural mitigation: snow fences, sheds
                      • Controlled triggering in high-risk areas
                      • Train SAR teams & educate mountain communities''',
        level: 'Advanced',
        duration: '10 min',
        iconData: Icons.snowing,
        color: Colors.grey.shade300,
        quizJsonPath: 'assets/module_quiz/avalanche_quiz.json',
        tags: ['avalanche', 'snow', 'mountain'],
        geographicRelevance: ['Jammu and Kashmir', 'Himachal Pradesh', 'Uttarakhand', 'Sikkim', 'Arunachal Pradesh'],
        videos: [
          VideoLesson(title: 'Avalanche Safety (Hindi)', size: 'N/A', url: 'https://ndma.gov.in/sites/default/files/IEC/coldwave/hindi/Avalanche.MP4'),
        ],
      ),
      LearningModule(
        id: 'fire_safety',
        title: 'Fire Safety Basics',
        description: '''• Enforce National Building Code (NBC)
                      • Regular Fire Safety Audits
                      • Fire escape plans + building mock drills
                      • Use non-combustible materials
                      • Increase community & school fire awareness''',
        level: 'Beginner',
        duration: '15 min',
        iconData: Icons.local_fire_department,
        color: Colors.orange.shade100,
        quizJsonPath: 'assets/module_quiz/firesafety_quiz.json',
        tags: ['fire', 'burn', 'safety'],
        geographicRelevance: [], // Global
        videos: [
           VideoLesson(title: 'Dost Appu on Fire Safety', size: '16.1 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/Firesafety/Dost%20Appu%20on%20Fire%20Safety%20.mp4'),
        ],
      ),
      LearningModule(
        id: 'landslide',
        title: 'Landslide',
        description: '''• Landslide Hazard Zonation (LHZ) mapping
                      • Advanced Early Warning Systems
                      • Slope stabilization & drainage improvement
                      • Bioengineering (vegetation, soil binding)
                      • Community training & SAR preparedness''',
        level: 'Advanced',
        duration: '20 min',
        iconData: Icons.landslide,
        color: Colors.brown.shade200,
        quizJsonPath: 'assets/module_quiz/landslide_quiz.json',
        tags: ['landslide', 'mountain', 'rain'],
        geographicRelevance: ['Himachal Pradesh', 'Uttarakhand', 'Jammu and Kashmir', 'Sikkim', 'West Bengal', 'Maharashtra', 'Kerala', 'Karnataka'],
        videos: [
          VideoLesson(title: 'Before Landslide', size: '30.7 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/Landslide/Video/Before%20Landslide.mp4'),
        ],
      ),
       LearningModule(
        id: 'tsunami',
        title: 'Tsunami',
        description: '''• Early Warning via INCOIS
                      • Vulnerability assessment of coastal zones
                      • Mitigation: bio-shields, coastal buffers
                      • Strong evacuation plans & drills
                      • Last-mile communication for alerts''',
        level: 'Advanced',
        duration: '15 min',
        iconData: Icons.waves,
        color: Colors.teal.shade200,
        quizJsonPath: 'assets/module_quiz/tsunami_quiz.json',
        tags: ['tsunami', 'ocean', 'wave'],
        geographicRelevance: ['Tamil Nadu', 'Andhra Pradesh', 'Odisha', 'West Bengal', 'Kerala', 'Karnataka', 'Goa', 'Maharashtra', 'Gujarat', 'Andaman and Nicobar Islands'],
        videos: [
          VideoLesson(title: 'Before Tsunami', size: '24.7 MB', url: 'https://ndma.gov.in/sites/default/files/IEC/Tsunami/Before%20Tsunami.mp4'),
        ],
      ),
      // --- Coming Soon Modules ---
      LearningModule(id: 'Home safety', title: 'Home Safety', description: '''• Secure heavy objects; reduce hazards
                                                                            • Install smoke alarms & fire extinguishers
                                                                            • Know utility shut-off points
                                                                            • Maintain home emergency kit
                                                                            • Prepare escape plans''', level: 'Beginner', duration: '10 min', iconData: Icons.home, color: Colors.grey.shade200, videos: [], quizJsonPath: '', tags: ['home', 'safety']),
      LearningModule(id: 'Hospital safety', title: 'Hospital Safety', description: '''• Structural safety: disaster-resistant buildings
                                                                                    • Functional safety: Hospital Disaster Plan
                                                                                    • Clear Incident Command System
                                                                                    • Mass casualty management & triage protocols
                                                                                    • Fire safety compliance
                                                                                    • Regular drills & staff training''', level: 'Beginner', duration: '10 min', iconData: Icons.local_hospital, color: Colors.red.shade100, videos: [], quizJsonPath: '', tags: ['hospital', 'medical']),
      LearningModule(id: 'EarthQuake', title: 'EarthQuake', description: '''• Enforce earthquake-resistant building design
                                                                          • Retrofit critical structures (schools, hospitals)
                                                                          • Strengthen Early Warning & techno-legal systems
                                                                          • Community training: Drop, Cover & Hold
                                                                          • Emergency response & capacity building''', iconData: Icons.local_hospital, color: Colors.red.shade100, videos: [], quizJsonPath: '', tags: ['earthquake', 'tremor']),
      LearningModule(id: 'Biological Emergencies', title: 'Biological Emergencies', description: '''• Early detection via IDSP
                                                                                                  • Biosafety protocols for labs & hospitals
                                                                                                  • Hygiene, sanitation & vector control
                                                                                                  • Medical readiness: PPE, isolation units
                                                                                                  • Strong public health communication''', iconData: Icons.local_hospital, color: Colors.red.shade100, videos: [], quizJsonPath: '', tags: ['biological', 'health']),
      LearningModule(
        id: 'Chemical Emergencies', 
        title: 'Chemical Emergencies', 
        description: '''• Safety audits for industries
                      • Risk assessment & hazard mapping
                      • On-site & Off-site emergency plans
                      • Quick response: decontamination, triage
                      • Multi-agency coordination (police, fire, health)''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['chemical', 'industrial']
      ),
      LearningModule(
        id: 'Nuclear Emergencies', 
        title: 'Nuclear Emergencies', 
        description: '''• Strict facility safety checks
                      • On-site & Off-site nuclear emergency plans
                      • Public alerts & guidance systems
                      • Protective actions: sheltering, potassium iodide, evacuation
                      • Specialized medical treatment for radiation exposure''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['nuclear', 'radiation']
      ),
      LearningModule(
        id: 'Community Coordination (CBDRM)', 
        title: 'Community Coordination (CBDRM)', 
        description: '''• HRVCA: Community-led hazard, risk & vulnerability assessment
                      • Create & update Village/Ward Disaster Management Plans
                      • Train Apda Mitras in first aid, search & rescue
                      • Plans must include vulnerable groups & align with govt systems''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['community', 'planning']
      ),
      LearningModule(
        id: 'Crowd Management', 
        title: 'Crowd Management', 
        description: '''• Pre-Event: Risk analysis, crowd estimates, venue capacity planning
                      • Safety Setup: Wide exits, clear signage, strong barricading (zig-zag)
                      • On-Ground: CCTV monitoring, analytics, public address system
                      • Emergency: ICS-based response, on-site medical aid, Quick Reaction Teams (QRTs)''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['crowd', 'safety']
      ),
      LearningModule(
        id: 'First Aid', 
        title: 'First Aid', 
        description: '''• Begin with Scene Safety & DRABC (Danger, Response, Airway, Breathing, Circulation)
                      • CPR for cardiac arrest
                      • Manage choking (FBAO)
                      • Control bleeding, treat burns, immobilize fractures/dislocations
                      • Manage shock; handle bites, stings & poison incidents''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['firstaid', 'medical']
      ),
      LearningModule(
        id: 'Frost Bite / Cold Wave (Extended Module)', 
        title: 'Frost Bite / Cold Wave (Extended Module)', 
        description: '''• Background & identification of frost-prone regions
                      • Hazard & vulnerability mapping
                      • Early warning alerts and public communication
                      • Prepare local Action Plans
                      • Mitigation for agriculture, health, and vulnerable groups
                      • Public awareness via IEC campaigns''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['cold', 'frostbite']
      ),LearningModule(
        id: 'Gas Explosion (Industrial/Chemical Emergencies)', 
        title: 'Gas Explosion (Industrial/Chemical Emergencies)', 
        description: '''• Defines risks & legal framework
                      • Conduct hazard analysis & risk assessment
                      • Mandatory On-site & Off-site emergency plans
                      • Strengthen preparedness: drills, safety audits
                      • Response includes coordinated rescue + medical management''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['gas', 'explosion', 'industrial']
      ),LearningModule(
        id: 'Innovative India', 
        title: 'Innovative India', 
        description: '''• Promote tech-based disaster solutions (drones, AI, apps, sensors)
                      • Encourage creative, local problem-solving
                      • Focus on smarter warnings, better rescue tools, resilient rebuilding
                      • Youth and community involvement for innovation-driven safety
                      • Aim: Make disaster resilience future-ready & tech-powered''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['innovation', 'tech']
      ),LearningModule(
        id: 'Smog', 
        title: 'Smog', 
        description: '''• Understand causes (NOx, ozone, PM2.5) & health impacts
                      • Follow AQI alerts & emergency action plans
                      • Personal protection: N95 masks, stay indoors during peak smog
                      • Promote public transport, reduce emissions, stop biomass burning
                      • Long-term mitigation through cleaner industry & city planning''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['smog', 'air', 'pollution']
      ),LearningModule(
        id: 'Post-Disaster Stress Management', 
        title: 'Post-Disaster Stress Management', 
        description: '''• Psychological First Aid (PFA): comfort, safety, reassurance
                      • Recognize normal stress vs PTSD signs
                      • Emotional support & trauma-informed care
                      • Key roles: mental health professionals, community leaders, family
                      • Long-term healing through counseling & community support''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['stress', 'mental', 'health']
      ),LearningModule(
        id: 'Prevent Monsoon Illness', 
        title: 'Prevent Monsoon Illness', 
        description: '''• Categorize diseases: water-borne, vector-borne, air-borne
                      • Water safety: boil & store properly
                      • Food hygiene & personal sanitation
                      • Vector control: remove stagnant water
                      • Early detection: know symptoms & seek timely medical care''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['monsoon', 'illness', 'health']
      ),LearningModule(
        id: 'Traditional Techniques (Indigenous Knowledge)', 
        title: 'Traditional Techniques (Indigenous Knowledge)', 
        description: '''• Traditional disaster-resistant building styles
                      • Nature-based early warnings (animal behavior, environmental cues)
                      • Indigenous water systems (stepwells, ponds)
                      • Community-based coping & social support systems
                      • Blend traditional wisdom with modern DRR strategies''', 
        iconData: Icons.local_hospital, 
        color: Colors.red.shade100, 
        videos: [], 
        quizJsonPath: '',
        tags: ['traditional', 'indigenous']
      ),
    ];
  }

  /// Load video progress from Hive and update module video completion status
  /// Phase: Video Progress Persistence Fix
  Future<void> _loadVideoProgress() async {
    if (_modules == null) return;

    try {
      print('🔄 [MODULE REPO] Loading video progress for all modules...');
      int updatedCount = 0;

      for (final module in _modules!) {
        try {
          final progress = await _videoProgressService.getModuleVideoProgress(module.id);
          if (progress != null && progress.completedCount > 0) {
            // Update VideoLesson.isCompleted from loaded progress
            for (final video in module.videos) {
              video.isCompleted = progress.isVideoCompleted(video.title);
            }
            updatedCount++;
            print('✅ [MODULE REPO] Updated progress for ${module.id}: ${progress.completedCount}/${progress.videos.length} videos');
          }
        } catch (e) {
          print('⚠️ [MODULE REPO] Error loading progress for ${module.id}: $e');
          // Continue with other modules
        }
      }

      print('✅ [MODULE REPO] Video progress loaded: $updatedCount modules updated');
    } catch (e) {
      print('❌ [MODULE REPO] Error loading video progress: $e');
    }
  }

  /// Get modules (cached)
  /// Returns the cached list of modules with video progress applied
  /// Throws StateError if repository is not initialized
  List<LearningModule> getModules() {
    if (!_isInitialized) {
      throw StateError(
        'ModuleRepository not initialized. Call initialize() first. '
        'This should be called in ProgressRestorationService or main.dart',
      );
    }
    return _modules!;
  }

  /// Update video progress for a specific module and video
  /// Phase: Video Progress Persistence Fix
  /// This updates the cached module immediately when a video is completed
  void updateVideoProgress(String moduleId, String videoTitle, bool isCompleted) {
    if (_modules == null) return;

    try {
      final module = _modules!.firstWhere((m) => m.id == moduleId);
      final video = module.videos.firstWhere(
        (v) => v.title == videoTitle,
        orElse: () => module.videos.first, // Fallback (shouldn't happen)
      );
      video.isCompleted = isCompleted;
      print('✅ [MODULE REPO] Updated cached module: $moduleId - $videoTitle = $isCompleted');
    } catch (e) {
      print('⚠️ [MODULE REPO] Error updating video progress: $e');
    }
  }

  /// Refresh video progress for all modules
  /// Phase: Video Progress Persistence Fix
  /// Call this when you want to reload progress from Hive
  Future<void> refreshVideoProgress() async {
    if (_modules == null) return;
    await _loadVideoProgress();
  }

  /// Check if repository is initialized
  bool get isInitialized => _isInitialized;

  /// Reset repository (for testing/debugging)
  void reset() {
    _modules = null;
    _isInitialized = false;
    _isInitializing = false;
  }
}