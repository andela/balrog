angular.module("app").controller('PermissionsController',
function ($scope, $routeParams, $location, $timeout, Permissions, Search, $modal, Page, PermissionsRequiredSignoffs) {

  Page.setTitle('Permissions');

  $scope.loading = true;
  $scope.failed = false;
  $scope.username = $routeParams.username;
  $scope.tab = 1;
  $scope.role = "All Roles";

  $scope.isAllRoles = function (role) {
    return $scope.role === "All Roles";
  };

  $scope.isSet = function (tabNum) {
    return $scope.tab === tabNum;
  };

  $scope.setTab = function (newTab) {
    $scope.tab = newTab;
  };
  $scope.roles_users = {};
  $scope.roles_list = ["All Roles"];
  Permissions.getRolesUsers()
    .success(function (response) {
      $scope.user_roles = _.map(response.roles, function (each) {
        var keys = Object.keys(each);
        $scope.roles_list.push(keys[0]);
        $scope.roles_users[keys[0]] = each[keys[0]];
        return each;
      });
    })
    .error(function () {
      console.error(arguments);
      $scope.failed = true;
    })
    .finally(function () {
      $scope.loading = false;
    });

  if ($scope.username) {
    // history of a specific rule
    Permissions.getUserPermissions($scope.username)
      .then(function (response) {
        $scope.permissions = response;
      });
  } else {
    Permissions.getUsers()
      .success(function (response) {
        $scope.users = _.map(response.users, function (each) {
          return { username: Object.keys(each).toString() };
        });
      })
      .error(function () {
        console.error(arguments);
        $scope.failed = true;
      })
      .finally(function () {
        $scope.loading = false;
      });
  }

  $scope.signoffRequirements = [];
  PermissionsRequiredSignoffs.getRequiredSignoffs()
    .then(function (payload) {
      $scope.signoffRequirements = payload.data.required_signoffs;
    });

  $scope.ordering = ['username'];

  $scope.currentPage = 1;
  $scope.pageSize = 10;  // default

  $scope.filters = {
    search: $location.hash(),
  };

  $scope.hasFilter = function () {
    return !!(false || $scope.filters.search.length);
  };

  $scope.$watchCollection('filters.search', function (value) {
    $location.hash(value);
    Search.noticeSearchChange(
      value,
      ['username']
    );
  });

  // I don't know how else to expose this to the templates
  // $scope.getWordRegexes = Search.getWordRegexes;
  $scope.highlightSearch = Search.highlightSearch;
  // $scope.removeFilterSearchWord = Search.removeFilterSearchWord;

  $scope.filterBySearch = function (item) {
    // basically, look for a reason to NOT include this
    if (Search.word_regexes.length) {
      // every word in the word_regexes array needs to have some match
      var matches = 0;
      _.each(Search.word_regexes, function (each) {
        var regex = each[0];
        var on = each[1];
        // console.log(regex, on);
        if ('username' in item) {
          if ((on === '*' || on === 'username') && item.username && item.username.match(regex)) {
            matches++;
            return;
          }
        }
        else {
          if ((on === '*' || on === 'role') && item.role && item.role.match(regex)) {
            matches++;
            return;
          }
        }
      });
      return matches === Search.word_regexes.length;
    }

    return true;  // include it
  };
  /* End filtering */

  $scope.openUpdateModal = function (user) {
    $scope.is_edit = true;
    var modalInstance = $modal.open({
      templateUrl: 'permissions_modal.html',
      controller: 'UserPermissionsCtrl',
      backdrop: 'static',
      size: 'md',  // can be lg or md, sm
      resolve: {
        users: function () {
          return $scope.users;
        },
        is_edit: function () {
          return $scope.is_edit;
        },
        user: function () {
          return user;
        },
        permissionSignoffRequirements: function () {
          return $scope.signoffRequirements;
        },
      }
    });
  };
  /* End openUpdateModal */

  $scope.openNewModal = function () {
    $scope.is_edit = false;
    var modalInstance = $modal.open({
      templateUrl: 'permissions_modal.html',
      controller: 'UserPermissionsCtrl',
      backdrop: 'static',
      size: 'md',
      resolve: {
        users: function () {
          return $scope.users;
        },
        is_edit: function () {
          return $scope.is_edit;
        },
        user: function () {
          return $scope.user;
        },
        permissionSignoffRequirements: function () {
          return $scope.signoffRequirements;
        },
      }
    });
  };
  /* End openNewModal */



  $scope.openNewScheduledPermissionChangeModal = function (user) {

    var modalInstance = $modal.open({
      templateUrl: 'permissions_scheduled_change_modal.html',
      controller: 'NewPermissionScheduledChangeCtrl',
      size: 'lg',
      backdrop: 'static',
      resolve: {
        scheduled_changes: function () {
          return [];
        },
        sc: function () {
          sc = angular.copy(user);
          sc["change_type"] = "insert";
          return sc;
        },
        permissionSignoffRequirements: function () {
          return $scope.signoffRequirements;
        },
      }
    });
  };



});
