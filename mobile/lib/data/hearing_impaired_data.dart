import '../models/module_models.dart';

class HearingImpairedRepository {
  static List<VideoLesson> getVideos() {
    return [
      VideoLesson(
        title: 'Cyclone - Preparedness', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/01_Cyclone.mp4', 
        size: 'Sign Language'
      ),
      VideoLesson(
        title: 'Cyclone - During & After', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/02_Cyclone.mp4', 
        size: '76.8 MB'
      ),
      VideoLesson(
        title: 'Heat Wave - Early Warning', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/Early-warning-and%20-preparedness-Heatwave.mp4', 
        size: '56.8 MB'
      ),
      VideoLesson(
        title: 'Heat Wave - Preparedness', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/Preparedness-for-HeatWave.mp4', 
        size: '92.5 MB'
      ),
      VideoLesson(
        title: 'Earthquake - Saavdhan Hai Toh Jaan Hai', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/03_Earthquake_%20SaavdhanHaiTohJaanHai.mp4', 
        size: '86.0 MB'
      ),
      VideoLesson(
        title: 'Earthquake - Jhuko Dhako Pakdo', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/06_JhukoDhakoPakdo.mp4', 
        size: '81.5 MB'
      ),
      VideoLesson(
        title: 'Earthquake - Salaah Se Salamati', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/05_Earthquake_%20SalaahSeSalamati.mp4', 
        size: '75.7 MB'
      ),
      VideoLesson(
        title: 'Earthquake - Resilience', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/04_EarthQuakeResilience.mp4', 
        size: '94.9 MB'
      ),
      VideoLesson(
        title: 'Flood - Before Flood', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/08_Before_Flood.mp4', 
        size: '84.6 MB'
      ),
      VideoLesson(
        title: 'Flood - During Flood', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/09_During_Flood.mp4', 
        size: '102 MB'
      ),
      VideoLesson(
        title: 'Flood - After Flood', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/07_After_Flood_.mp4', 
        size: '79.9 MB'
      ),
      VideoLesson(
        title: 'Landslide', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/12_Landslide.mp4', 
        size: 'Sign Language'
      ),
      VideoLesson(
        title: 'Urban Flood', 
        url: 'https://ndma.gov.in/sites/default/files/signvideos/13_Urban_Flood.mp4', 
        size: 'Sign Language'
      ),
    ];
  }
}