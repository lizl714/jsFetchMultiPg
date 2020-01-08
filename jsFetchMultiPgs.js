
    /* Define the datatable 
     *  any newly added column headers must be added here under columns
     */
    let oTable = $("#actv").DataTable({
            "paging": true,
            "pageLength": 30,
            "pagingType": "full_numbers",
            "scrollCollapse": true,
            "scrollY": ( 0.7 * $(window).height() ),
            "sort": true,           // This allows the user to sort the table by any column
            "autoWidth": true,
            "order":[0,"desc"],      // first time - present table ordered by date - most recent first
            "dom": "Btp",
            columns: [
                {title: "Date"},
                {title: "Type"},
                {title: "Repo"},
                {title: "Message", "sWidth": "25%"}]  // setting this to 25% so longer msgs will wrap
    });

    // Disabling the Enter key - user must use Retrieve button
    $(document).keypress(function (e) {
        if (e.which == 13) {
            return false;
        }
    });

    // Retrieve button was clicked
    $("#usr").click(function() {

        let user = document.getElementById("userid").value;

        getActv(user);

    });
    
    // Clear button was clicked
    $("#clr").click(function() {
        // clear the user, the table and the events queue
        document.getElementById("userid").value = "";
        oTable.clear().draw();
     });


     /* Breaking this method out for unit testing - so mock data could be used
      * Verify the user ID
      * Get recent activity from github based on the user entered
      */
     function getActv(user){

         // clear the table and the events queue before getting this user data
         oTable.clear().draw();

         /* Github requires - "Username may only contain alphanumeric characters
          * or single hyphens,and cannot begin or end with a hyphen."
          */
         if (!user.match(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/)) {
             alert(
                 "User ID must be alphanumeric or single hyphen " +
                 "and cannot start/end with hyphen."
             );
             return false;
         }

         // Fetch and display all the events
         fetchAll(user);
   
    }
     
     // Get recent activity from github based on the user entered
    // Fetch all the pages (up to 10) for this user
    function fetchAll(user) {
        let url = "https://api.github.com/users/" + user + "/events?page=";
        // Create an array of all the urls for pages 1 through 10
        let page = 0;
        let urls = [];
        while (page < 10) {
        	page++;
        	urls.push(url + page);
    	}
        // map every url to the promise of the fetch
        let requests = urls.map(url => fetch(url));
    
        // Promise.all waits until all jobs are resolved
        Promise.all(requests)
            .then(responses => Promise.all(responses.map(r => r.json())))
            .then(data => {
            	// If there is a message - there was an error of some kind - display the error
                if ( data[0].message != undefined) {
                    let message = data[0].message;
                    // check for API rate limit exceeded for ... - then they have to login to Github to continue
                    if (message.substring(0,23) == "API rate limit exceeded") {
                    	
                    }
                    alert(message);
            	    return false;
                }
             let events = processEvents(data);
             // redraw the table with the events found
             oTable.rows.add(events).draw();
       })
       		.catch(error=>alert(error.message));
    }

    // Pull the desired data from the event
    function processEvents(pages) {

        // Activity events queue
        let events = [];
        let eventCounter = 0;
        let page = 0;
        while(page < pages.length) {
            let returnData = pages[page];
            let event = 0;
            while(event < returnData.length) {
                // Not all events have messages
                let msg = "";
                if (returnData[event].payload.commits != undefined) {
                    msg = returnData[event].payload.commits[0].message;
                }
                events[eventCounter] = [returnData[event].created_at,
                    returnData[event].type,
                    returnData[event].repo.name,
                    msg
                ];
                event++;
                eventCounter++;
            }
            page++;
        }
        return events;
    
    }

