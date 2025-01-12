import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import firebase from "../../Config"; 


export default function UsersList (props) {
  
  const currentId = props.route.params.currentId;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await firebase
        .firestore()
        .collection("users")
        .where("uid", "!=", currentId) // Exclude the current user
        .get();

      const fetchedUsers = snapshot.docs.map((doc) => doc.data());
      setUsers(fetchedUsers);
    };

    fetchUsers();
  }, [currentId]);

  const initiateChat = (userId) => {
    // Navigate to ChatPage and pass the selected user's ID
    navigation.navigate("ChatPage", {
      currentId: currentId,
      chatWithId: userId,
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.userContainer}>
            <Text style={styles.userName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => initiateChat(item.uid)}
            >
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  userContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  chatButton: {
    backgroundColor: "#6200ee",
    padding: 10,
    borderRadius: 5,
  },
  chatButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});