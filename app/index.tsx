import { useSQLiteContext, type SQLiteDatabase } from "@/services/database/SQLiteProvider";
import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * The Item type represents a single item in database.
 */
interface ItemEntity {
  id: number;
  done: boolean;
  value: string;
}
export default function Index() {
  const db = useSQLiteContext();
  const [text, setText] = useState('');
  const [todoItems, setTodoItems] = useState<ItemEntity[]>([]);
  const [doneItems, setDoneItems] = useState<ItemEntity[]>([]);

  const refetchItems = useCallback(() => {
    async function refetch() {
      await db.withExclusiveTransactionAsync(async () => {
        setTodoItems(
          await db.getAllAsync<ItemEntity>(
            'SELECT * FROM items WHERE done = ?',
            false
          )
        );
        setDoneItems(
          await db.getAllAsync<ItemEntity>(
            'SELECT * FROM items WHERE done = ?',
            true
          )
        );
      });
    }
    refetch();
  }, [db]);

  useEffect(() => {
    refetchItems();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SQLite Example</Text>

      <View style={styles.flexRow}>
        <TextInput
          onChangeText={(text) => setText(text)}
          onSubmitEditing={async () => {
            await addItemAsync(db, text);
            await refetchItems();
            setText('');
          }}
          placeholder="what do you need to do?"
          style={styles.input}
          value={text}
        />
      </View>

      <ScrollView style={styles.listArea}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Todo</Text>
          {todoItems.map((item) => (
            <Item
              key={item.id}
              item={item}
              onPressItem={async (id) => {
                await updateItemAsDoneAsync(db, id);
                await refetchItems();
              }}
            />
          ))}
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Completed</Text>
          {doneItems.map((item) => (
            <Item
              key={item.id}
              item={item}
              onPressItem={async (id) => {
                await deleteItemAsync(db, id);
                await refetchItems();
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Item({
  item,
  onPressItem,
}: {
  item: ItemEntity;
  onPressItem: (id) => void | Promise<void>;
}) {
  const { id, done, value } = item;
  return (
    <TouchableOpacity
      onPress={() => onPressItem && onPressItem(id)}
      style={[styles.item, done && styles.itemDone]}
    >
      <Text style={[styles.itemText, done && styles.itemTextDone]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

async function addItemAsync(db: SQLiteDatabase, text: string): Promise<void> {
  if (text !== '') {
    await db.runAsync(
      'INSERT INTO items (done, value) VALUES (?, ?);',
      false,
      text
    );
  }
}

async function updateItemAsDoneAsync(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('UPDATE items SET done = ? WHERE id = ?;', true, id);
}

async function deleteItemAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM items WHERE id = ?;', id);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: 64,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flexRow: {
    flexDirection: 'row',
  },
  input: {
    borderColor: '#4630eb',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
  listArea: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
  item: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    padding: 8,
  },
  itemDone: {
    backgroundColor: '#1c9963',
  },
  itemText: {
    color: '#000',
  },
  itemTextDone: {
    color: '#fff',
  },
});
