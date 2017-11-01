angular.module("app").controller('PermissionsController',
function($scope, $routeParams, $location, $timeout, Permissions, Search, $modal, Page, PermissionsRequiredSignoffs, Helpers) {

  Page.setTitle('Permissions');

  $scope.loading = true;
  $scope.failed = false;
  $scope.username = $routeParams.username;
  $scope.users = [];
  $scope.tab = 1;
  $scope.roles_list = ["All Roles"];
  $scope.current_role = $scope.roles_list[0];
  $scope.users2 = [];

  if ($scope.username) {
    // history of a specific rule
    Permissions.getUserPermissions($scope.username)
      .then(function (response) {
        $scope.permissions = response;
      });
  } else {
    Permissions.getUsers()
      .success(function (response) {
        $scope.users = _.map(response.users, function(eachUser){
          return eachUser;
        });
      })
      .error(function () {
        console.error(arguments);
        $scope.failed = true;
      })
      .finally(function () {
        $scope.loading = false;
        console.log(($scope.users));
        console.log('the roles users are:',getRolesUsers())

      });

    $scope.permissions_count = $scope.users.length;
    $scope.page_size_pair = [{ id: 20, name: '20' },
    { id: 50, name: '50' },
    { id: $scope.permissions_count, name: 'All' }];

  }
  $scope.getUsers = function () {
    return $scope.users.map(function (eachUser) {
      var username = Object.keys(eachUser);
      return { username: username[0] };
    });
  };
  $scope.getRolesUsers = function() {
  var roles = {};
  $scope.users.forEach(function (eachUser) {
    var username = Object.keys(eachUser)[0];
    eachUser[username].forEach(function (eachRole) {
      if (!roles.hasOwnProperty(eachRole.role) ) {
        roles[eachRole.role] = [];
      }
        roles[eachRole.role].push(username)
      
    });
  });
  return roles;
}

  console.log('users are:',$scope.getUsers())


  $scope.signoffRequirements = [];
  PermissionsRequiredSignoffs.getRequiredSignoffs()
    .then(function (payload) {
      $scope.signoffRequirements = payload.data.required_signoffs;
    });

  $scope.ordering = ['username'];

  $scope.currentPage = 1;
  $scope.storedPageSize = JSON.parse(localStorage.getItem('permissions_page_size'));
  $scope.pageSize = $scope.storedPageSize? $scope.storedPageSize.id : 20;
  $scope.page_size = {id: $scope.pageSize, name: $scope.storedPageSize? $scope.storedPageSize.name : $scope.pageSize};

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
        roles_list: function() {
          return $scope.roles_list;
        }
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
        roles_list: function() {
          return $scope.roles_list;
        }
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

  $scope.selectPageSize = function() {
    Helpers.selectPageSize($scope, 'permissions_page_size');
  };



});



        // var roles = {};
        // $scope.users = _.map(response.users, function (eachUser) {
        //   var username = Object.keys(eachUser);
        //   eachUser[username[0]].map(function (eachRole) {
        //     if (!roles.hasOwnProperty(eachRole.role)) {
        //       roles[eachRole.role] = [];
        //     }
        //     if ($scope.roles_list.indexOf(eachRole.role) === -1) {
        //       $scope.roles_list.sort().push(eachRole.role);
        //     }
        //     roles[eachRole.role].push(username[0]);
        //   });
        //   $scope.roles_users = roles;
        //   return { username: username[0] };
        // });