import 'package:flutter/material.dart';
import 'app_localizations_en.dart';

/// App Localizations
abstract class AppLocalizations {
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizationsEn();
  }

  // App Info
  String get appName;
  String get appDescription;

  // Common
  String get ok;
  String get cancel;
  String get save;
  String get delete;
  String get edit;
  String get close;
  String get loading;
  String get error;
  String get success;

  // Auth
  String get login;
  String get logout;
  String get register;
  String get email;
  String get password;
  String get confirmPassword;
  String get name;
  String get forgotPassword;
  String get loginSuccess;
  String get loginError;
  String get registerSuccess;
  String get registerError;

  // Dashboard
  String get home;
  String get learn;
  String get games;
  String get profile;
  String get ask;
  String get welcome;
  String get preparednessScore;
  String get quickActions;
  String get startDrill;
  String get viewModules;
  String get playGame;
  String get takeQuiz;
  String get emergency;

  // Modules
  String get modules;
  String get noModulesAvailable;
  String get lastUpdated;
  String get difficulty;
  String get duration;
  String get completed;
  String get notCompleted;

  // Profile
  String get settings;
  String get appMode;
  String get peaceMode;
  String get crisisMode;
  String get language;
  String get about;
  String get appVersion;
  String get role;

  // Emergency
  String get crisisAlert;
  String get imSafe;
  String get needHelp;
  String get fireAlert;
  String get earthquakeAlert;
  String get floodAlert;
  String get cycloneAlert;

  // Sync
  String get syncing;
  String get synced;
  String get pending;
  String get syncNow;

  // Developer
  String get developerMenu;
  String get forceCrisisMode;
  String get clearLocalStorage;
  String get switchRole;
  String get injectMockData;
  String get sendFakeMeshMessage;

  // Phase 4: Crisis Mode & Drills
  String get practiceDrill;
  String get emergencyEvacuateNow;
  String get acknowledgeParticipation;
  String get startARNavigation;
  String get deadManSwitchWarning;
  String get markedAsSafe;
  String get helpRequestSent;
  String get noResponseDetected;
  String get markedAsPotentiallyTrapped;
  String get exitDrill;
  String get exitDrillConfirmation;
  String get stay;
  String get exit;
  String get drillDetails;
  String get drillNotFound;
  String get scheduled;
  String get inProgress;
  String get cancelled;
  String get participants;
  String get total;
  String get acknowledged;
  String get participationRate;
  String get avgEvacuationTime;
  String get timeRemaining;
  String get viewDrillMode;
  String get drills;
  String get active;
  String get all;
  String get noDrillsFound;
  String get pullDownToRefresh;
  String get source;
  String get locationRequiredForHelp;
  String get userNotAuthenticated;
  String get failedToUpdateStatus;
  String get failedToSendHelpRequest;
  String get failedToAcknowledgeDrill;
  String get unableToStartARNavigation;
  String get failedToStartARNavigation;
  String get arNavigation;
  String get potentiallyTrapped;

  // Phase 4.9: Accessibility Settings
  String get accessibilitySettings;

  // B8: Primary chrome / journey labels
  String get loginTagline;
  String get signIn;
  String get joinYourClass;
  String get emergencyHelp;
  String get askKavach;
  String get parentDashboard;
  String get parentChildren;
  String get scanQr;
  String get alerts;
  String get appearanceOnlyNote;
}

