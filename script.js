$(document).ready(function() {
    var table = $('#blogPostsTable').DataTable({
        ajax: {
            url: 'https://dummyapi.online/api/blogposts',
            dataSrc: ''  // Data is at the root of the response
        },
        columns: [
            {
                className: 'details-control',
                orderable: false,
                data: null,
                defaultContent: '<i class="bi bi-plus-circle small-icon"></i>' // Small black icon
            },
            { data: 'id',
                class:'hidden'
             }, // ID column
            { data: 'title' }, // Title column
            { data: 'author' }, // Author column
            {
                data: 'date_published',
                render: function(data) {
                    return data;
                }
            },
            {
                data: null,
                className: 'text-center action-buttons',
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <button class="btn btn-edit" title="Edit"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-delete" title="Delete"><i class="bi bi-trash"></i></button>
                    `;
                }
            }
        ],
        order: [[1, 'asc']], // Sorting by the second column (ID) by default
        language: {
            emptyTable: "No blog posts available"
        }
    });

    function format(rowData) {
        return `<div class="content-box">
                    <p><strong>Content:</strong> ${rowData.content}</p>
                </div>`;
    }

    $('#blogPostsTable tbody').on('click', 'i', function () {
        var tr = $(this).closest('tr');
        var row = table.row(tr);

        if (row.child.isShown()) {
            row.child().find('.content-box').removeClass('show');
            setTimeout(() => row.child.hide(), 300);
            $(this).removeClass('bi-dash-circle').addClass('bi-plus-circle');
        } else {
            row.child(format(row.data())).show();
            setTimeout(() => row.child().find('.content-box').addClass('show'), 10);
            $(this).removeClass('bi-plus-circle').addClass('bi-dash-circle');
        }
    });

    $('#blogPostsTable tbody').on('click', '.btn-edit', function () {
        var row = table.row($(this).closest('tr'));
        var rowData = row.data();
        $('#editId').val(rowData.id);
        $('#editTitle').val(rowData.title);
        $('#editAuthor').val(rowData.author);
        $('#editDate').val(rowData.date_published);
        $('#editModal').modal('show');
    });

    $('#editForm').on('submit', function (e) {
        e.preventDefault();
        var id = $('#editId').val();
        var title = $('#editTitle').val();
        var author = $('#editAuthor').val();
        var date = $('#editDate').val();
        var isValid = true;

        $('.form-control').removeClass('is-invalid');
        $('.invalid-feedback').hide();

        if (!title) {
            $('#editTitle').addClass('is-invalid');
            $('#editTitle').next('.invalid-feedback').show();
            isValid = false;
        }
        if (!author) {
            $('#editAuthor').addClass('is-invalid');
            $('#editAuthor').next('.invalid-feedback').show();
            isValid = false;
        }
        if (!date) {
            $('#editDate').addClass('is-invalid');
            $('#editDate').next('.invalid-feedback').show();
            isValid = false;
        }

        if (isValid) {
            var row = table.row(function(idx, data, node) {
                return data.id == id;
            }).data();

            if (row) {
                row.title = title;
                row.author = author;
                row.date_published = date;
                table.row(function(idx, data, node) {
                    return data.id == id;
                }).data(row).draw();
                $('#editModal').modal('hide');
                Swal.fire('Updated!', 'The blog post has been updated.', 'success');
            } else {
                Swal.fire('Error', 'Error updating data.', 'error');
            }
        }
    });

    var rowToDelete;
    $('#blogPostsTable tbody').on('click', '.btn-delete', function () {
        rowToDelete = table.row($(this).closest('tr'));
        var rowData = rowToDelete.data();
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete the post with ID: ${rowData.id}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                rowToDelete.remove().draw();
                Swal.fire('Deleted!', 'The blog post has been deleted.', 'success');
            }
        });
    });

    $('#searchInput').autocomplete({
        source: function(request, response) {
            var authors = table.column(3).data().toArray(); // Only use authors' column
            
            var suggestions = $.unique(
                authors.filter(item => item.toLowerCase().includes(request.term.toLowerCase()))
            ).slice(0, 10);
            
            response(suggestions);
        },
        autoFocus: true,
        minLength: 1,
        select: function(event, ui) {
            var searchTerm = ui.item.value.toLowerCase();
            table.search(searchTerm).draw();
        }
    });
    
    // Handle title filter
    $('#titleSearchInput').on('keyup', function () {
        var searchTerm = $(this).val().toLowerCase();
        table.column(2).search(searchTerm).draw(); // Column index 2 for Title
    });

    // Handle date filter
    $('#filterByDateButton').on('click', function () {
        var selectedDate = $('#dateFilterInput').val();
        if (selectedDate) {
            table.column(4).search(selectedDate).draw(); // Column index 4 for Date
        }
    });

    $('#newPostForm').on('submit', function (e) {
        e.preventDefault();
        var title = $('#newTitle').val();
        var author = $('#newAuthor').val();
        var date = $('#newDate').val();
        var content = $('#newContent').val();
        var isValid = true;
    
        // Remove previous validation states
        $('.form-control').removeClass('is-invalid');
        $('.invalid-feedback').hide();
    
        // Validate inputs
        if (!title) {
            $('#newTitle').addClass('is-invalid');
            $('#newTitle').next('.invalid-feedback').show();
            isValid = false;
        }
        if (!author) {
            $('#newAuthor').addClass('is-invalid');
            $('#newAuthor').next('.invalid-feedback').show();
            isValid = false;
        }
        if (!date) {
            $('#newDate').addClass('is-invalid');
            $('#newDate').next('.invalid-feedback').show();
            isValid = false;
        }
        if (!content) {
            $('#newContent').addClass('is-invalid');
            $('#newContent').next('.invalid-feedback').show();
            isValid = false;
        }
    
        if (isValid) {
            var newId = table.data().count() + 1; // Generate a new ID
            table.row.add({
                id: newId,
                title: title,
                author: author,
                date_published: date,
                content: content
            }).draw(false); // Draw without resetting the pagination
    
            // Move the newly added row to the top
            table.order([1, 'desc']).draw();
    
            // Hide the modal
            $('#newPostModal').modal('hide');
            
            // Display success message
            Swal.fire('Added!', 'The new blog post has been added.', 'success');
            
            // Clear the form inputs
            $(this).find('input, textarea').val('');
        }
    });
    
     // Handle download button click
     $('#downloadButton').on('click', function () {
        Swal.fire({
            title: 'Download Options',
            text: 'Choose the format to download the file:',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF'
        }).then((result) => {
            if (result.isConfirmed) {
                downloadExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                downloadPDF();
            }
        });
    });

    function downloadExcel() {
        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.json_to_sheet(table.rows().data().toArray());
        XLSX.utils.book_append_sheet(wb, ws, "BlogPosts");
        XLSX.writeFile(wb, 'blog_posts.xlsx');
    }

    function downloadPDF() {
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        var tableData = table.rows().data().toArray();
        
        doc.text("Blog Posts", 14, 16);
        var y = 22;
        tableData.forEach(function(row) {
            doc.text(`ID: ${row.id}`, 14, y);
            doc.text(`Title: ${row.title}`, 14, y + 6);
            doc.text(`Author: ${row.author}`, 14, y + 12);
            doc.text(`Date: ${row.date_published}`, 14, y + 18);
            y += 30;
        });
        
        doc.save('blog_posts.pdf');
    }
});