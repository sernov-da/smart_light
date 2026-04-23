class FakeAuthService {
  FakeAuthService._();

  static final Map<String, Map<String, String>> _users = {
    'test@example.com': {
      'name': 'Test User',
      'password': '123456',
    },
  };

  static bool register({
    required String name,
    required String email,
    required String password,
  }) {
    final key = email.trim().toLowerCase();

    if (_users.containsKey(key)) {
      return false;
    }

    _users[key] = {
      'name': name.trim(),
      'password': password,
    };

    return true;
  }

  static bool login({
    required String email,
    required String password,
  }) {
    final key = email.trim().toLowerCase();
    final user = _users[key];

    if (user == null) return false;

    return user['password'] == password;
  }

  static String? getUserName(String email) {
    final key = email.trim().toLowerCase();
    return _users[key]?['name'];
  }
}