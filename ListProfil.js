import React, { useState, useEffect } from "react";
import {
  FlatList,
  Linking,
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/MaterialIcons";
import firebase from "../../Config";

const database = firebase.database();
const ref_listProfil = database.ref("listProfil");
const ref_groups = database.ref("Groups");

export default function ListProfile(props) {
  const [data, setData] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [groupName, setGroupName] = useState("");
  const currentId = props.route.params.currentId;

  useEffect(() => {
    const listener = ref_listProfil.on("value", (snapshot) => {
      const profiles = [];
      snapshot.forEach((childSnapshot) => {
        const profile = childSnapshot.val();
        // Exclude the current user and avoid duplicates
        if (profile.id !== currentId && !profiles.find((p) => p.id === profile.id)) {
          profiles.push(profile);
        }
      });
      setData(profiles);
    });

    return () => {
      ref_listProfil.off("value");
    };
  }, [currentId]);

  const toggleSelection = (profile) => {
    setSelectedProfiles((prevSelectedProfiles) => {
      if (prevSelectedProfiles.includes(profile)) {
        return prevSelectedProfiles.filter((p) => p.id !== profile.id);
      }
      return [...prevSelectedProfiles, profile];
    });
  };

  const createGroup = () => {
    if (!groupName.trim()) return;

    const newGroupRef = ref_groups.push();
    const groupId = newGroupRef.key;
    const members = selectedProfiles.map((profile) => profile.id);

    newGroupRef
      .set({
        id: groupId,
        name: groupName,
        members: [currentId, ...members],
      })
      .then(() => {
        console.log("Group created with ID:", groupId);
      })
      .catch((error) => {
        console.error("Error creating group:", error);
      });

    setGroupName(""); // Reset group name
    setSelectedProfiles([]); // Reset selected profiles
  };

  const makeCall = (telephone) => {
    Linking.openURL(`tel:${telephone}`);
  };

  const sendSMS = (telephone) => {
    Linking.openURL(`sms:${telephone}`);
  };

  const navigateToChat = (secondId, nom) => {
    console.log("Navigating to chat with currentId:", currentId, "and secondId:", secondId);
    props.navigation.navigate("Chat", { currentId, secondId, nom });
  };

  return (
    <ImageBackground
      source={require("../../assets/flower.jpg")}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#fff" />
      <Text style={styles.textstyle}>List of Profiles</Text>
      <FlatList
        data={data}
        extraData={selectedProfiles} // Ensures re-rendering when selection changes
        keyExtractor={(item) => item.id} // Use unique IDs
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.profileCard,
              selectedProfiles.includes(item) && styles.selectedCard,
            ]}
            onPress={() => toggleSelection(item)}
          >
            <View style={styles.profileInfo}>
              <Image
                source={
                  item.Image
                    ? { uri: item.Image }
                    : require("../../assets/flower.jpg")
                }
                style={styles.profileImage}
              />
              <View style={styles.profileDetails}>
                <Text style={styles.profileText}>{item.nom}</Text>
                <Text style={styles.profileSubText}>{item.telephone}</Text>
              </View>
            </View>

            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={() => navigateToChat(item.id, item.nom)}
                style={styles.iconButton}
              >
                <Icon name="send" size={24} color="#c6a3c6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => makeCall(item.phone)}
                style={styles.iconButton}
              >
                <Icon name="phone" size={24} color="#c6a3c6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendSMS(item.phone)}
                style={styles.iconButton}
              >
                <Icon name="sms" size={24} color="#c6a3c6" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        style={{ width: "95%" }}
      />

      {selectedProfiles.length > 0 && (
        <View style={styles.actionBar}>
          <TextInput
            style={styles.groupInput}
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TouchableOpacity onPress={createGroup} style={styles.createButton}>
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  textstyle: {
    marginTop: 35,
    fontSize: 40,
    fontFamily: "serif",
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: "#0004",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedCard: {
    backgroundColor: "#c6a3c6", // Highlight selected cards
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  profileDetails: {
    flexDirection: "column",
  },
  profileText: {
    fontSize: 18,
    color: "#fff",
  },
  profileSubText: {
    fontSize: 14,
    color: "#ccc",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    alignItems: "center",
    marginHorizontal: 5,
  },
  actionBar: {
    backgroundColor: "#fff",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    position: "absolute",
    bottom: 0,
  },
  groupInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  createButton: {
    backgroundColor: "#c6a3c6",
    padding: 10,
    borderRadius: 5,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
