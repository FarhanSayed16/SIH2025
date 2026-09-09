import 'app_localizations.dart';

/// English Localizations
class AppLocalizationsEn extends AppLocalizations {
  // App Info
  @override
  String get appName => 'EduSafe';

  @override
  String get appDescription => 'Disaster Preparedness System';

  // Common
  @override
  String get ok => 'OK';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String get delete => 'Delete';

  @override
  String get edit => 'Edit';

  @override
  String get close => 'Close';

  @override
  String get loading => 'Loading...';

  @override
  String get error => 'Error';

  @override
  String get success => 'Success';

  // Auth
  @override
  String get login => 'Login';

  @override
  String get logout => 'Logout';

  @override
  String get register => 'Register';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get confirmPassword => 'Confirm Password';

  @override
  String get name => 'Name';

  @override
  String get forgotPassword => 'Forgot Password?';

  @override
  String get loginSuccess => 'Login successful';

  @override
  String get loginError => 'Login failed';

  @override
  String get registerSuccess => 'Registration successful';

  @override
  String get registerError => 'Registration failed';

  // Dashboard
  @override
  String get home => 'Home';

  @override
  String get learn => 'Learn';

  @override
  String get games => 'Games';

  @override
  String get profile => 'Profile';

  @override
  String get ask => 'Ask';

  @override
  String get welcome => 'Welcome';

  @override
  String get preparednessScore => 'Preparedness Score';

  @override
  String get quickActions => 'Quick Actions';

  @override
  String get startDrill => 'Start Drill';

  @override
  String get viewModules => 'View Modules';

  @override
  String get playGame => 'Play Game';

  @override
  String get takeQuiz => 'Take Quiz';

  @override
  String get emergency => 'EMERGENCY';

  // Modules
  @override
  String get modules => 'Modules';

  @override
  String get noModulesAvailable => 'No modules available';

  @override
  String get lastUpdated => 'Last updated';

  @override
  String get difficulty => 'Difficulty';

  @override
  String get duration => 'Duration';

  @override
  String get completed => 'Completed';

  @override
  String get notCompleted => 'Not Completed';

  // Profile
  @override
  String get settings => 'Settings';

  @override
  String get appMode => 'App Mode';

  @override
  String get peaceMode => 'Peace Mode';

  @override
  String get crisisMode => 'Crisis Mode';

  @override
  String get language => 'Language';

  @override
  String get about => 'About';

  @override
  String get appVersion => 'App Version';

  @override
  String get role => 'Role';

  // Emergency
  @override
  String get crisisAlert => 'EMERGENCY ALERT';

  @override
  String get imSafe => "I'M SAFE";

  @override
  String get needHelp => 'NEED HELP';

  @override
  String get fireAlert => 'FIRE ALERT';

  @override
  String get earthquakeAlert => 'EARTHQUAKE ALERT';

  @override
  String get floodAlert => 'FLOOD ALERT';

  @override
  String get cycloneAlert => 'CYCLONE ALERT';

  // Sync
  @override
  String get syncing => 'Syncing...';

  @override
  String get synced => 'Synced';

  @override
  String get pending => 'pending';

  @override
  String get syncNow => 'Sync Now';

  // Developer
  @override
  String get developerMenu => 'Developer Menu';

  @override
  String get forceCrisisMode => 'Force Crisis Mode';

  @override
  String get clearLocalStorage => 'Clear Local Storage';

  @override
  String get switchRole => 'Switch Role';

  @override
  String get injectMockData => 'Inject Mock Data';

  @override
  String get sendFakeMeshMessage => 'Send Fake Mesh Message';

  // Phase 4: Crisis Mode & Drills
  @override
  String get practiceDrill => '⚠️ PRACTICE DRILL — This is not a real emergency ⚠️';

  @override
  String get emergencyEvacuateNow => '🚨 EMERGENCY — EVACUATE NOW! 🚨';

  @override
  String get acknowledgeParticipation => 'ACKNOWLEDGE PARTICIPATION';

  @override
  String get startARNavigation => 'START AR NAVIGATION';

  @override
  String get deadManSwitchWarning => "If no response in 5 min, you'll be marked as potentially trapped";

  @override
  String get markedAsSafe => '✓ You have been marked as SAFE';

  @override
  String get helpRequestSent => '🚨 Help request sent. Help is on the way!';

  @override
  String get noResponseDetected => 'No response detected. You have been marked as potentially trapped.';

  @override
  String get markedAsPotentiallyTrapped => 'Potentially Trapped';

  @override
  String get exitDrill => 'Exit Drill?';

  @override
  String get exitDrillConfirmation => 'Are you sure you want to exit the drill screen?';

  @override
  String get stay => 'Stay';

  @override
  String get exit => 'Exit';

  @override
  String get drillDetails => 'Drill Details';

  @override
  String get drillNotFound => 'Drill not found';

  @override
  String get scheduled => 'Scheduled';

  @override
  String get inProgress => 'In Progress';

  @override
  String get cancelled => 'Cancelled';

  @override
  String get participants => 'Participants';

  @override
  String get total => 'Total';

  @override
  String get acknowledged => 'Acknowledged';

  @override
  String get participationRate => 'Participation Rate';

  @override
  String get avgEvacuationTime => 'Avg Evacuation Time';

  @override
  String get timeRemaining => 'Time remaining';

  @override
  String get viewDrillMode => 'View Drill Mode';

  @override
  String get drills => 'Drills';

  @override
  String get active => 'Active';

  @override
  String get all => 'All';

  @override
  String get noDrillsFound => 'No drills found';

  @override
  String get pullDownToRefresh => 'Pull down to refresh';

  @override
  String get source => 'Source';

  @override
  String get locationRequiredForHelp => 'Location required for help request. Please enable GPS.';

  @override
  String get userNotAuthenticated => 'User not authenticated';

  @override
  String get failedToUpdateStatus => 'Failed to update status';

  @override
  String get failedToSendHelpRequest => 'Failed to send help request';

  @override
  String get failedToAcknowledgeDrill => 'Failed to acknowledge drill';

  @override
  String get unableToStartARNavigation => 'Unable to start AR navigation: School information not available';

  @override
  String get failedToStartARNavigation => 'Failed to start AR navigation';

  @override
  String get arNavigation => 'AR Navigation';

  @override
  String get potentiallyTrapped => 'Potentially Trapped';

  // Phase 4.9: Accessibility Settings
  @override
  String get accessibilitySettings => 'Accessibility Settings';

  @override
  String get loginTagline => 'Learn safety. Practise preparedness.';

  @override
  String get signIn => 'Sign in';

  @override
  String get joinYourClass => 'Join your class';

  @override
  String get emergencyHelp => 'Emergency help';

  @override
  String get askKavach => 'Ask Kavach';

  @override
  String get parentDashboard => 'Dashboard';

  @override
  String get parentChildren => 'Children';

  @override
  String get scanQr => 'Scan QR';

  @override
  String get alerts => 'Alerts';

  @override
  String get appearanceOnlyNote =>
      'Appearance only; does not start or end an incident';
}

