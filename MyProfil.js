import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import firebase from "../../Config"; // Firebase configuration
import { useNavigation } from '@react-navigation/native'; // Importer le hook de navigation

const database = firebase.database();
const auth = firebase.auth();
export default function ListProfil({ route }) {
  const currentid = route.params?.currentid || "";
  const [profiles, setProfiles] = useState([]);
  const navigation = useNavigation();

  const [nom, setNom] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [emploi, setEmploi] = useState("");
  const [uriLocalImage, setUriLocalImage] = useState("");
  const [imageBase64, setImageBase64] = useState("");

  useEffect(() => {
    const ref_listProfil = database.ref("MyProfil");
    ref_listProfil.on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allProfiles = Object.values(data);
        // Filtrer pour exclure le profil de l'utilisateur connecté
        const filteredProfiles = allProfiles.filter(
          (profile) => profile.id !== currentid
        );
        setProfiles(filteredProfiles);
      }
    });

    // Nettoyage
    return () => ref_listProfil.off("value");
  }, [currentid]);


  const uriToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // Remove "data:image/jpeg;base64,"
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUriLocalImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
  if (nom && pseudo && telephone && adresse && dateNaissance && lieuNaissance && emploi) {
    let base64Image = imageBase64;
    if (uriLocalImage) {
      try {
        base64Image = await uriToBase64(uriLocalImage); // Convertir l'image en base64
      } catch (error) {
        alert("Erreur lors de la conversion de l'image !");
        return;
      }
    }

    const user = auth.currentUser; // Récupérer l'utilisateur connecté
    if (user) {
      const userEmail = user.email;
      const ref_listProfil = database.ref("MyProfil");
      const ref_un_profil = ref_listProfil.child(currentid); // Accéder au profil de l'utilisateur connecté

      // Mettre à jour les données du profil dans Firebase
      ref_un_profil
        .update({
          id: currentid,
          nom,
          pseudo,
          telephone,
          adresse,
          dateNaissance,
          lieuNaissance,
          emploi,
          imageBase64: base64Image,
          email: userEmail,
        })
        .then(() => {
          alert("Profil mis à jour avec succès !");
        })
        .catch((error) => {
          alert("Erreur lors de la mise à jour du profil : " + error.message);
        });
    } else {
      alert("Utilisateur non connecté !");
    }
  } else {
    alert("Veuillez remplir tous les champs !");
  }
};

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.navigate("Auth"); // Naviguer vers la page d'authentification après la déconnexion
    }).catch((error) => {
      alert("Erreur lors de la déconnexion : " + error.message);
    });
  };

  return (
    <ImageBackground source={require("../../assets/backk.jpg")} style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.textstyle}>
          {nom && pseudo ? `${nom} ${pseudo}` : "Mon profil"}
        </Text>

        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          <Image
            source={
              uriLocalImage
                ? { uri: uriLocalImage }
                : imageBase64
                ? { uri: `data:image/jpeg;base64,${imageBase64}` }
                : require("../../assets/backk.jpg")
            }
            style={styles.image}
          />
        </TouchableOpacity>
        <Text style={styles.imageText}>Choisir une photo</Text>

        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <TextInput
              value={nom}
              onChangeText={setNom}
              placeholder="Nom"
              style={styles.textinputstyle}
            />
            <TextInput
              value={pseudo}
              onChangeText={setPseudo}
              placeholder="Pseudo"
              style={styles.textinputstyle}
            />
            <TextInput
              value={telephone}
              onChangeText={setTelephone}
              placeholder="Téléphone"
              keyboardType="phone-pad"
              style={styles.textinputstyle}
            />
            <TextInput
              value={adresse}
              onChangeText={setAdresse}
              placeholder="Adresse"
              style={styles.textinputstyle}
            />
            <TextInput
              value={dateNaissance}
              onChangeText={setDateNaissance}
              placeholder="Date de naissance (ex: JJ/MM/AAAA)"
              style={styles.textinputstyle}
            />
            <TextInput
              value={lieuNaissance}
              onChangeText={setLieuNaissance}
              placeholder="Lieu de naissance"
              style={styles.textinputstyle}
            />
            <TextInput
              value={emploi}
              onChangeText={setEmploi}
              placeholder="Emploi"
              style={styles.textinputstyle}
            />
          </View>

          <TouchableOpacity onPress={saveProfile} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>

          {/* Ajout du bouton de déconnexion */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  scrollView: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    width: "100%",
  },
  textstyle: {
    fontSize: 25,
    color: "#4B0082",
    fontWeight: "700",
    fontFamily: "Roboto",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 60,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  formContainer: {
    width: 350,
    height: 700,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    alignItems: "center",
    elevation: 5,
  },
  formCard: {
    width: "100%",
    padding: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    elevation: 5,
  },
  textinputstyle: {
    width: "100%",
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  imageText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#DDA0DD",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Roboto",
    letterSpacing: 0.5,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  saveButton: {
    backgroundColor: "#DDA0DD",
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    width: 250,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    width: 250,
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
});
