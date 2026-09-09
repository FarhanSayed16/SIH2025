import 'app_localizations.dart';

/// Marathi (मराठी) Localizations
/// Phase 4.9: Enhanced language support
class AppLocalizationsMr extends AppLocalizations {
  // App Info
  @override
  String get appName => 'EduSafe';

  @override
  String get appDescription => 'आपत्ती तयारी प्रणाली';

  // Common
  @override
  String get ok => 'ठीक आहे';

  @override
  String get cancel => 'रद्द करा';

  @override
  String get save => 'जतन करा';

  @override
  String get delete => 'हटवा';

  @override
  String get edit => 'संपादन करा';

  @override
  String get close => 'बंद करा';

  @override
  String get loading => 'लोड होत आहे...';

  @override
  String get error => 'त्रुटी';

  @override
  String get success => 'यशस्वी';

  // Auth
  @override
  String get login => 'लॉगिन';

  @override
  String get logout => 'लॉगआउट';

  @override
  String get register => 'नोंदणी करा';

  @override
  String get email => 'ईमेल';

  @override
  String get password => 'पासवर्ड';

  @override
  String get confirmPassword => 'पासवर्डची पुष्टी करा';

  @override
  String get name => 'नाव';

  @override
  String get forgotPassword => 'पासवर्ड विसरलात?';

  @override
  String get loginSuccess => 'लॉगिन यशस्वी';

  @override
  String get loginError => 'लॉगिन अयशस्वी';

  @override
  String get registerSuccess => 'नोंदणी यशस्वी';

  @override
  String get registerError => 'नोंदणी अयशस्वी';

  // Dashboard
  @override
  String get home => 'मुख्यपृष्ठ';

  @override
  String get learn => 'शिका';

  @override
  String get games => 'खेळ';

  @override
  String get profile => 'प्रोफाइल';

  @override
  String get ask => 'विचारा';

  @override
  String get welcome => 'स्वागत आहे';

  @override
  String get preparednessScore => 'तयारी गुण';

  @override
  String get quickActions => 'द्रुत क्रिया';

  @override
  String get startDrill => 'ड्रिल सुरू करा';

  @override
  String get viewModules => 'मॉड्यूल पहा';

  @override
  String get playGame => 'खेळ खेळा';

  @override
  String get takeQuiz => 'क्विझ घ्या';

  @override
  String get emergency => 'आणीबाणी';

  // Modules
  @override
  String get modules => 'मॉड्यूल';

  @override
  String get noModulesAvailable => 'कोणतेही मॉड्यूल उपलब्ध नाहीत';

  @override
  String get lastUpdated => 'अंतिम अद्यतन';

  @override
  String get difficulty => 'अडचण';

  @override
  String get duration => 'कालावधी';

  @override
  String get completed => 'पूर्ण';

  @override
  String get notCompleted => 'अपूर्ण';

  // Profile
  @override
  String get settings => 'सेटिंग्ज';

  @override
  String get appMode => 'ॲप मोड';

  @override
  String get peaceMode => 'शांतता मोड';

  @override
  String get crisisMode => 'संकट मोड';

  @override
  String get language => 'भाषा';

  @override
  String get about => 'बद्दल';

  @override
  String get appVersion => 'ॲप आवृत्ती';

  @override
  String get role => 'भूमिका';

  // Emergency
  @override
  String get crisisAlert => 'आणीबाणी चेतावणी';

  @override
  String get imSafe => 'मी सुरक्षित आहे';

  @override
  String get needHelp => 'मदत हवी आहे';

  @override
  String get fireAlert => 'आग चेतावणी';

  @override
  String get earthquakeAlert => 'भूकंप चेतावणी';

  @override
  String get floodAlert => 'पूर चेतावणी';

  @override
  String get cycloneAlert => 'चक्रीवादळ चेतावणी';

  // Sync
  @override
  String get syncing => 'सिंक होत आहे...';

  @override
  String get synced => 'सिंक झाले';

  @override
  String get pending => 'प्रलंबित';

  @override
  String get syncNow => 'आत्ता सिंक करा';

  // Developer
  @override
  String get developerMenu => 'डेव्हलपर मेनू';

  @override
  String get forceCrisisMode => 'संकट मोड फोर्स करा';

  @override
  String get clearLocalStorage => 'स्थानिक स्टोरेज साफ करा';

  @override
  String get switchRole => 'भूमिका बदला';

  @override
  String get injectMockData => 'मॉक डेटा इंजेक्ट करा';

  @override
  String get sendFakeMeshMessage => 'बनावट मेश संदेश पाठवा';

  // Phase 4: Crisis Mode & Drills
  @override
  String get practiceDrill => '⚠️ सराव ड्रिल — ही वास्तविक आणीबाणी नाही ⚠️';

  @override
  String get emergencyEvacuateNow => '🚨 आणीबाणी — आत्ताच रिकामे करा! 🚨';

  @override
  String get acknowledgeParticipation => 'सहभाग स्वीकारा';

  @override
  String get startARNavigation => 'AR नेव्हिगेशन सुरू करा';

  @override
  String get deadManSwitchWarning => '5 मिनिटांत प्रतिसाद न मिळाल्यास, तुम्हाला संभाव्यपणे अडकलेले म्हणून चिन्हांकित केले जाईल';

  @override
  String get markedAsSafe => '✓ तुम्हाला सुरक्षित म्हणून चिन्हांकित केले गेले आहे';

  @override
  String get helpRequestSent => '🚨 मदतीची विनंती पाठवली. मदत येत आहे!';

  @override
  String get noResponseDetected => 'प्रतिसाद आढळला नाही. तुम्हाला संभाव्यपणे अडकलेले म्हणून चिन्हांकित केले गेले आहे.';

  @override
  String get markedAsPotentiallyTrapped => 'संभाव्यपणे अडकलेले';

  @override
  String get exitDrill => 'ड्रिल मधून बाहेर पडायचे?';

  @override
  String get exitDrillConfirmation => 'तुम्हाला खरोखरच ड्रिल स्क्रीन मधून बाहेर पडायचे आहे?';

  @override
  String get stay => 'रहा';

  @override
  String get exit => 'बाहेर पडा';

  @override
  String get drillDetails => 'ड्रिल तपशील';

  @override
  String get drillNotFound => 'ड्रिल आढळली नाही';

  @override
  String get scheduled => 'नियोजित';

  @override
  String get inProgress => 'प्रगतीत';

  @override
  String get cancelled => 'रद्द';

  @override
  String get participants => 'सहभागी';

  @override
  String get total => 'एकूण';

  @override
  String get acknowledged => 'स्वीकारले';

  @override
  String get participationRate => 'सहभाग दर';

  @override
  String get avgEvacuationTime => 'सरासरी रिकामे करण्याची वेळ';

  @override
  String get timeRemaining => 'उर्वरित वेळ';

  @override
  String get viewDrillMode => 'ड्रिल मोड पहा';

  @override
  String get drills => 'ड्रिल';

  @override
  String get active => 'सक्रिय';

  @override
  String get all => 'सर्व';

  @override
  String get noDrillsFound => 'कोणतीही ड्रिल आढळली नाही';

  @override
  String get pullDownToRefresh => 'रिफ्रेश करण्यासाठी खाली खेचा';

  @override
  String get source => 'स्रोत';

  @override
  String get locationRequiredForHelp => 'मदतीच्या विनंतीसाठी स्थान आवश्यक आहे. कृपया GPS सक्षम करा.';

  @override
  String get userNotAuthenticated => 'वापरकर्ता प्रमाणित नाही';

  @override
  String get failedToUpdateStatus => 'स्थिती अपडेट करण्यात अयशस्वी';

  @override
  String get failedToSendHelpRequest => 'मदतीची विनंती पाठवण्यात अयशस्वी';

  @override
  String get failedToAcknowledgeDrill => 'ड्रिल स्वीकारण्यात अयशस्वी';

  @override
  String get unableToStartARNavigation => 'AR नेव्हिगेशन सुरू करण्यास असमर्थ: शाळा माहिती उपलब्ध नाही';

  @override
  String get failedToStartARNavigation => 'AR नेव्हिगेशन सुरू करण्यात अयशस्वी';

  @override
  String get arNavigation => 'AR नेव्हिगेशन';

  @override
  String get potentiallyTrapped => 'संभाव्यपणे अडकलेले';

  // Phase 4.9: Accessibility Settings
  @override
  String get accessibilitySettings => 'प्रवेशयोग्यता सेटिंग्ज';

  @override
  String get loginTagline => 'सुरक्षा शिका. तयारीचा सराव करा.';

  @override
  String get signIn => 'साइन इन';

  @override
  String get joinYourClass => 'तुमच्या वर्गात सामील व्हा';

  @override
  String get emergencyHelp => 'आपत्कालीन मदत';

  @override
  String get askKavach => 'कवचला विचारा';

  @override
  String get parentDashboard => 'डॅशबोर्ड';

  @override
  String get parentChildren => 'मुले';

  @override
  String get scanQr => 'QR स्कॅन';

  @override
  String get alerts => 'अलर्ट';

  @override
  String get appearanceOnlyNote =>
      'फक्त दिसणे; यामुळे घटना सुरू किंवा संपत नाही';
}

